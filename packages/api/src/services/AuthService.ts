import type { DataSource } from "typeorm";
import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type {
  AuthUser,
  AuthResult,
  GenericMessage,
  ValidateTokenResult,
} from "@satyrsmc/shared/dto/auth";
import { UserStatus, UserType } from "@satyrsmc/shared/lib/enums";
import { User } from "../entities/User";
import { Registration } from "../entities/Registration";
import { Contact } from "../entities/Contact";
import { ContactEmail } from "../entities/ContactEmail";
import type { EmailService } from "./EmailService";
import { toISOStringOrNull } from "../lib/date";
import { uuid } from "./utils";

const BCRYPT_COST = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REGISTRATION_EXPIRY_DAYS = 14;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  return crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
}

function entityToAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    username: user.username,
    user_type: user.userType,
    user_status: user.userStatus,
    contact_id: user.contactId,
    member_id: user.memberId,
    is_member: user.memberId !== null,
    last_login: toISOStringOrNull(user.lastLogin),
  };
}

export class AuthService {
  private ds: DataSource;
  private emailService: EmailService;

  constructor(ds: DataSource, emailService: EmailService) {
    this.ds = ds;
    this.emailService = emailService;
  }

  async register(input: {
    email: string;
    first_name: string;
    last_name: string;
  }): Promise<GenericMessage> {
    const repo = this.ds.getRepository(Registration);

    // Check for existing registration with same email (delete if expired)
    const existing = await this.ds
      .getRepository(Registration)
      .createQueryBuilder("r")
      .where("LOWER(r.email) = LOWER(:email)", { email: input.email })
      .getOne();

    if (existing) {
      if (existing.expiresAt < new Date()) {
        await repo.remove(existing);
      } else {
        // Already registered and not expired — return generic response
        return { message: "If that email is eligible, a registration link has been sent." };
      }
    }

    // Check if a user with this email already exists
    const existingUser = await this.ds
      .createQueryBuilder()
      .select("u.id")
      .from(User, "u")
      .innerJoin(ContactEmail, "ce", "ce.contact_id = u.contact_id")
      .where("LOWER(ce.email) = LOWER(:email)", { email: input.email })
      .getRawOne();

    if (existingUser) {
      // User already exists — return generic response (prevent enumeration)
      return { message: "If that email is eligible, a registration link has been sent." };
    }

    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REGISTRATION_EXPIRY_DAYS);

    const registration = repo.create({
      id: uuid(),
      email: input.email,
      firstName: input.first_name,
      lastName: input.last_name,
      tokenHash,
      expiresAt,
    });
    await repo.save(registration);

    const name = `${input.first_name} ${input.last_name}`;
    await this.emailService.sendRegistrationEmail(input.email, rawToken, name);

    return { message: "If that email is eligible, a registration link has been sent." };
  }

  async validateToken(token: string): Promise<ValidateTokenResult> {
    const tokenHash = await hashToken(token);
    const registration = await this.ds
      .getRepository(Registration)
      .findOne({ where: { tokenHash } });

    if (!registration || registration.expiresAt < new Date()) {
      return { valid: false };
    }

    return {
      valid: true,
      email: registration.email,
      first_name: registration.firstName ?? undefined,
      last_name: registration.lastName ?? undefined,
    };
  }

  async signup(input: {
    token: string;
    username: string;
    password: string;
    birthday: string;
  }): Promise<AuthResult> {
    const tokenHash = await hashToken(input.token);
    const regRepo = this.ds.getRepository(Registration);
    const registration = await regRepo.findOne({ where: { tokenHash } });

    if (!registration || registration.expiresAt < new Date()) {
      throw new Error("Invalid or expired registration token");
    }

    // Check username uniqueness
    const existingUser = await this.ds
      .getRepository(User)
      .createQueryBuilder("u")
      .where("LOWER(u.username) = LOWER(:username)", { username: input.username })
      .getOne();

    if (existingUser) {
      throw new Error("Username is already taken");
    }

    // Create or reuse contact
    let contactId = registration.contactId;
    if (!contactId) {
      const contactRepo = this.ds.getRepository(Contact);
      const displayName =
        [registration.firstName, registration.lastName].filter(Boolean).join(" ") ||
        registration.email;
      const contact = contactRepo.create({
        id: uuid(),
        type: "person" as never,
        status: "active" as never,
        displayName,
        firstName: registration.firstName,
        lastName: registration.lastName,
      });
      await contactRepo.save(contact);
      contactId = contact.id;

      // Create contact email
      const emailRepo = this.ds.getRepository(ContactEmail);
      const contactEmail = emailRepo.create({
        id: uuid(),
        contactId,
        email: registration.email,
        type: "home" as never,
        isPrimary: true,
      });
      await emailRepo.save(contactEmail);
    }

    // Hash password and create user
    const passwordHash = await hash(input.password, BCRYPT_COST);
    const userRepo = this.ds.getRepository(User);
    const user = userRepo.create({
      id: uuid(),
      contactId,
      memberId: registration.memberId,
      username: input.username,
      passwordHash,
      userType: UserType.User,
      userStatus: UserStatus.Locked,
    });
    await userRepo.save(user);

    // Delete registration
    await regRepo.remove(registration);

    // Notify admin
    await this.emailService.sendAdminNotification(
      "New user registration",
      `User "${input.username}" has registered and is pending approval.`,
    );

    return { user: entityToAuthUser(user) };
  }

  async login(input: { username: string; password: string }): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const userRepo = this.ds.getRepository(User);
    const user = await userRepo
      .createQueryBuilder("u")
      .where("LOWER(u.username) = LOWER(:username)", { username: input.username })
      .getOne();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    // Check if account is locked due to too many attempts
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error("Account is temporarily locked. Please try again later.");
    }

    // Check account status
    if (user.userStatus !== UserStatus.Active) {
      throw new Error("Account is not active");
    }

    // Verify password
    const valid = await compare(input.password, user.passwordHash);
    if (!valid) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }
      await userRepo.save(user);
      throw new Error("Invalid username or password");
    }

    // Success: reset attempts and update last login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    await userRepo.save(user);

    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);

    return {
      user: entityToAuthUser(user),
      accessToken,
      refreshToken,
    };
  }

  async me(userId: string): Promise<AuthUser | null> {
    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user) return null;
    return entityToAuthUser(user);
  }

  async refresh(refreshToken: string): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(refreshToken, secret);
    const userId = payload.sub;
    if (!userId) {
      throw new Error("Invalid refresh token");
    }

    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user || user.userStatus !== UserStatus.Active) {
      throw new Error("User not found or inactive");
    }

    const newAccessToken = await this.signAccessToken(user);
    const newRefreshToken = await this.signRefreshToken(user);

    return {
      user: entityToAuthUser(user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(email: string): Promise<GenericMessage> {
    // Find user by email (through contact)
    const result = await this.ds
      .createQueryBuilder()
      .select("u.id", "userId")
      .addSelect("u.username", "username")
      .from(User, "u")
      .innerJoin(ContactEmail, "ce", "ce.contact_id = u.contact_id")
      .where("LOWER(ce.email) = LOWER(:email)", { email })
      .getRawOne();

    if (result) {
      const rawToken = generateToken();
      const tokenHash = await hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.ds.getRepository(User).update(result.userId, {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      });

      await this.emailService.sendPasswordResetEmail(email, rawToken, result.username as string);
    }

    return { message: "If that email exists, a reset link has been sent." };
  }

  async resetPassword(input: { token: string; password: string }): Promise<GenericMessage> {
    const tokenHash = await hashToken(input.token);
    const user = await this.ds
      .getRepository(User)
      .findOne({ where: { resetTokenHash: tokenHash } });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new Error("Invalid or expired reset token");
    }

    const passwordHash = await hash(input.password, BCRYPT_COST);
    user.passwordHash = passwordHash;
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.passwordChangedAt = new Date();
    await this.ds.getRepository(User).save(user);

    return { message: "Password has been reset successfully." };
  }

  async verifyAccessToken(token: string): Promise<{
    userId: string;
    userType: UserType;
    memberId: string | null;
    contactId: string;
  } | null> {
    try {
      const secret = getJwtSecret();
      const { payload } = await jwtVerify(token, secret);
      return {
        userId: payload.sub as string,
        userType: payload.userType as UserType,
        memberId: (payload.memberId as string) ?? null,
        contactId: payload.contactId as string,
      };
    } catch {
      return null;
    }
  }

  private async signAccessToken(user: User): Promise<string> {
    const secret = getJwtSecret();
    return new SignJWT({
      userType: user.userType,
      memberId: user.memberId,
      contactId: user.contactId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .sign(secret);
  }

  private async signRefreshToken(user: User): Promise<string> {
    const secret = getJwtSecret();
    return new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .sign(secret);
  }
}
