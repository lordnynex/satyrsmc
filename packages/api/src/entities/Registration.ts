import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("registrations")
export class Registration {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  email!: string;

  @Column({ name: "first_name", type: "text", nullable: true })
  firstName!: string | null;

  @Column({ name: "last_name", type: "text", nullable: true })
  lastName!: string | null;

  @Column({ name: "token_hash", type: "text" })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "contact_id", type: "text", nullable: true })
  contactId!: string | null;

  @Column({ name: "member_id", type: "text", nullable: true })
  memberId!: string | null;

  @Column({ name: "invited_by", type: "text", nullable: true })
  invitedBy!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
