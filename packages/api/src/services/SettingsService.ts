import type { DataSource } from "typeorm";
import { compare, hash } from "bcryptjs";
import type {
  AccountSettingsGetOutput,
  ChangePasswordOutput,
  ChangeEmailOutput,
} from "@satyrsmc/shared/dto/member/settings";
import { User } from "../entities/User";
import { ContactEmail } from "../entities/ContactEmail";
import { toISOStringOrNull } from "../lib/date";

const BCRYPT_COST = 12;

export class SettingsService {
  constructor(private ds: DataSource) {}

  async getAccount(userId: string): Promise<AccountSettingsGetOutput> {
    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const primaryEmail = await this.ds
      .getRepository(ContactEmail)
      .findOne({ where: { contactId: user.contactId, isPrimary: true } });

    return {
      username: user.username,
      user_type: user.userType,
      user_status: user.userStatus,
      email: primaryEmail?.email ?? null,
      created_at: toISOStringOrNull(user.createdAt),
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordOutput> {
    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) throw new Error("Current password is incorrect");

    const passwordHash = await hash(newPassword, BCRYPT_COST);
    await this.ds.getRepository(User).update(userId, {
      passwordHash,
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  }

  async changeEmail(
    userId: string,
    newEmail: string,
    password: string,
  ): Promise<ChangeEmailOutput> {
    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // Verify password
    const valid = await compare(password, user.passwordHash);
    if (!valid) throw new Error("Password is incorrect");

    // Check uniqueness across all contacts
    const existing = await this.ds
      .getRepository(ContactEmail)
      .createQueryBuilder("ce")
      .where("LOWER(ce.email) = LOWER(:email)", { email: newEmail })
      .andWhere("ce.contactId != :contactId", { contactId: user.contactId })
      .getOne();

    if (existing) throw new Error("Email is already in use");

    // Update or create primary email
    const emailRepo = this.ds.getRepository(ContactEmail);
    const primaryEmail = await emailRepo.findOne({
      where: { contactId: user.contactId, isPrimary: true },
    });

    if (primaryEmail) {
      primaryEmail.email = newEmail;
      await emailRepo.save(primaryEmail);
    } else {
      await emailRepo.save(
        emailRepo.create({
          id: crypto.randomUUID(),
          contactId: user.contactId,
          email: newEmail,
          type: "home" as never,
          isPrimary: true,
        }),
      );
    }

    return { success: true };
  }
}
