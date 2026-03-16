import type { DataSource } from "typeorm";
import type {
  UserListOutput,
  UserGetOutput,
  UserUpdateStatusOutput,
  UserUpdateTypeOutput,
  UserLinkMemberOutput,
  UserLinkContactOutput,
  UserAddNoteOutput,
  UserCreateInvitationOutput,
  RegistrationListOutput,
  UserPendingCountOutput,
} from "@satyrsmc/shared/dto/admin/user";
import type { UserType, UserStatus } from "@satyrsmc/shared/lib/enums";
import { User } from "../entities/User";
import { Registration } from "../entities/Registration";
import type { EmailService } from "./EmailService";
import { toISOStringOrNull } from "../lib/date";
import { uuid } from "./utils";

function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  return crypto.subtle.digest("SHA-256", data).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  );
}

function generateToken(): string {
  return crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
}

function userToOutput(user: User, displayName?: string, email?: string | null): UserGetOutput {
  return {
    id: user.id,
    contact_id: user.contactId,
    member_id: user.memberId,
    username: user.username,
    user_type: user.userType,
    user_status: user.userStatus,
    last_login: toISOStringOrNull(user.lastLogin),
    failed_login_attempts: user.failedLoginAttempts,
    locked_until: toISOStringOrNull(user.lockedUntil),
    admin_note: user.adminNote,
    created_at: toISOStringOrNull(user.createdAt),
    updated_at: toISOStringOrNull(user.updatedAt),
    display_name: displayName,
    email: email ?? null,
  };
}

export class UsersService {
  private ds: DataSource;
  private emailService: EmailService;

  constructor(ds: DataSource, emailService: EmailService) {
    this.ds = ds;
    this.emailService = emailService;
  }

  async list(params?: {
    status?: UserStatus;
    user_type?: UserType;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserListOutput> {
    const limit = params?.limit ?? 25;
    const offset = params?.offset ?? 0;

    let qb = this.ds
      .getRepository(User)
      .createQueryBuilder("u")
      .leftJoin("contacts", "c", "c.id = u.contact_id")
      .leftJoin("contact_emails", "ce", "ce.contact_id = u.contact_id AND ce.is_primary = true")
      .select(["u.*", "c.display_name AS display_name", "ce.email AS email"]);

    if (params?.status) {
      qb = qb.andWhere("u.user_status = :status", { status: params.status });
    }
    if (params?.user_type) {
      qb = qb.andWhere("u.user_type = :userType", { userType: params.user_type });
    }
    if (params?.q) {
      qb = qb.andWhere(
        "(LOWER(u.username) LIKE :q OR LOWER(c.display_name) LIKE :q OR LOWER(ce.email) LIKE :q)",
        { q: `%${params.q.toLowerCase()}%` },
      );
    }

    const total = await qb.getCount();
    const rows = await qb.orderBy("u.created_at", "DESC").limit(limit).offset(offset).getRawMany();

    const users = rows.map((r) =>
      userToOutput(
        Object.assign(new User(), {
          id: r.id,
          contactId: r.contact_id,
          memberId: r.member_id,
          username: r.username,
          userType: r.user_type,
          userStatus: r.user_status,
          lastLogin: r.last_login,
          failedLoginAttempts: r.failed_login_attempts,
          lockedUntil: r.locked_until,
          adminNote: r.admin_note,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }),
        r.display_name as string | undefined,
        r.email as string | null | undefined,
      ),
    );

    return { users, total };
  }

  async get(id: string): Promise<UserGetOutput | null> {
    const row = await this.ds
      .getRepository(User)
      .createQueryBuilder("u")
      .leftJoin("contacts", "c", "c.id = u.contact_id")
      .leftJoin("contact_emails", "ce", "ce.contact_id = u.contact_id AND ce.is_primary = true")
      .select(["u.*", "c.display_name AS display_name", "ce.email AS email"])
      .where("u.id = :id", { id })
      .getRawOne();

    if (!row) return null;

    return userToOutput(
      Object.assign(new User(), {
        id: row.id,
        contactId: row.contact_id,
        memberId: row.member_id,
        username: row.username,
        userType: row.user_type,
        userStatus: row.user_status,
        lastLogin: row.last_login,
        failedLoginAttempts: row.failed_login_attempts,
        lockedUntil: row.locked_until,
        adminNote: row.admin_note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }),
      row.display_name as string | undefined,
      row.email as string | null | undefined,
    );
  }

  async updateStatus(id: string, userStatus: UserStatus): Promise<UserUpdateStatusOutput | null> {
    const repo = this.ds.getRepository(User);
    const user = await repo.findOne({ where: { id } });
    if (!user) return null;

    user.userStatus = userStatus;
    user.updatedAt = new Date();
    await repo.save(user);

    return this.get(id);
  }

  async updateType(id: string, userType: UserType): Promise<UserUpdateTypeOutput | null> {
    const repo = this.ds.getRepository(User);
    const user = await repo.findOne({ where: { id } });
    if (!user) return null;

    user.userType = userType;
    user.updatedAt = new Date();
    await repo.save(user);

    return this.get(id);
  }

  async linkMember(id: string, memberId: string | null): Promise<UserLinkMemberOutput | null> {
    const repo = this.ds.getRepository(User);
    const user = await repo.findOne({ where: { id } });
    if (!user) return null;

    user.memberId = memberId;
    user.updatedAt = new Date();
    await repo.save(user);

    return this.get(id);
  }

  async linkContact(id: string, contactId: string): Promise<UserLinkContactOutput | null> {
    const repo = this.ds.getRepository(User);
    const user = await repo.findOne({ where: { id } });
    if (!user) return null;

    user.contactId = contactId;
    user.updatedAt = new Date();
    await repo.save(user);

    return this.get(id);
  }

  async addNote(id: string, adminNote: string): Promise<UserAddNoteOutput | null> {
    const repo = this.ds.getRepository(User);
    const user = await repo.findOne({ where: { id } });
    if (!user) return null;

    user.adminNote = adminNote;
    user.updatedAt = new Date();
    await repo.save(user);

    return this.get(id);
  }

  async createInvitation(
    input: {
      email: string;
      first_name?: string;
      last_name?: string;
      contact_id?: string;
      member_id?: string;
    },
    invitedBy?: string,
  ): Promise<UserCreateInvitationOutput> {
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const repo = this.ds.getRepository(Registration);
    const registration = repo.create({
      id: uuid(),
      email: input.email,
      firstName: input.first_name ?? null,
      lastName: input.last_name ?? null,
      tokenHash,
      expiresAt,
      contactId: input.contact_id ?? null,
      memberId: input.member_id ?? null,
      invitedBy: invitedBy ?? null,
    });
    await repo.save(registration);

    const name = [input.first_name, input.last_name].filter(Boolean).join(" ") || input.email;
    await this.emailService.sendRegistrationEmail(input.email, rawToken, name);

    return {
      id: registration.id,
      email: registration.email,
      first_name: registration.firstName,
      last_name: registration.lastName,
      expires_at: registration.expiresAt.toISOString(),
      contact_id: registration.contactId,
      member_id: registration.memberId,
      invited_by: registration.invitedBy,
      created_at: toISOStringOrNull(registration.createdAt),
    };
  }

  async pendingCount(): Promise<UserPendingCountOutput> {
    const lockedResult: [{ count: string }] = await this.ds
      .getRepository(User)
      .query(`SELECT COUNT(*)::int AS count FROM users WHERE user_status = 'locked'`);
    const regResult: [{ count: string }] = await this.ds
      .getRepository(Registration)
      .query(`SELECT COUNT(*)::int AS count FROM registrations`);

    return {
      locked_count: Number(lockedResult[0]?.count ?? 0),
      registration_count: Number(regResult[0]?.count ?? 0),
    };
  }

  async listRegistrations(): Promise<RegistrationListOutput> {
    const registrations = await this.ds
      .getRepository(Registration)
      .createQueryBuilder("r")
      .orderBy("r.created_at", "DESC")
      .getMany();

    return registrations.map((r) => ({
      id: r.id,
      email: r.email,
      first_name: r.firstName,
      last_name: r.lastName,
      expires_at: r.expiresAt.toISOString(),
      contact_id: r.contactId,
      member_id: r.memberId,
      invited_by: r.invitedBy,
      created_at: toISOStringOrNull(r.createdAt),
    }));
  }
}
