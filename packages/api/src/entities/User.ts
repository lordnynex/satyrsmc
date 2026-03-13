import { Entity, PrimaryColumn, Column } from "typeorm";
import type { UserType } from "@satyrsmc/shared/lib/enums";
import type { UserStatus } from "@satyrsmc/shared/lib/enums";

@Entity("users")
export class User {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ name: "member_id", type: "text", nullable: true })
  memberId!: string | null;

  @Column({ type: "text" })
  username!: string;

  @Column({ name: "password_hash", type: "text" })
  passwordHash!: string;

  @Column({
    name: "user_type",
    type: "enum",
    enum: ["user", "admin", "webmaster"],
    enumName: "user_type_enum",
    default: "user",
  })
  userType!: UserType;

  @Column({
    name: "user_status",
    type: "enum",
    enum: ["active", "locked", "rejected", "suspended", "inactive", "deactivated"],
    enumName: "user_status_enum",
    default: "locked",
  })
  userStatus!: UserStatus;

  @Column({ name: "last_login", type: "timestamptz", nullable: true })
  lastLogin!: Date | null;

  @Column({ name: "failed_login_attempts", type: "integer", default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: "locked_until", type: "timestamptz", nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: "reset_token_hash", type: "text", nullable: true })
  resetTokenHash!: string | null;

  @Column({ name: "reset_token_expires_at", type: "timestamptz", nullable: true })
  resetTokenExpiresAt!: Date | null;

  @Column({ name: "password_changed_at", type: "timestamptz", nullable: true })
  passwordChangedAt!: Date | null;

  @Column({ name: "admin_note", type: "text", nullable: true })
  adminNote!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
