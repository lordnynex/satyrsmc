import { Entity, PrimaryColumn, Column } from "typeorm";
import { InvitationPurpose } from "@satyrsmc/shared/lib/enums";
import type { InvitationPurpose as InvitationPurposeType } from "@satyrsmc/shared/lib/enums";

@Entity("invitations")
export class Invitation {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text", nullable: true })
  contactId!: string | null;

  @Column({ name: "token_hash", type: "text", unique: true })
  tokenHash!: string;

  @Column({
    type: "enum",
    enum: InvitationPurpose,
    enumName: "invitation_purpose_enum",
    default: InvitationPurpose.AccountSetup,
  })
  purpose!: InvitationPurposeType;

  @Column({ name: "event_id", type: "text", nullable: true })
  eventId!: string | null;

  @Column({ name: "created_by_user_id", type: "text", nullable: true })
  createdByUserId!: string | null;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "claimed_at", type: "timestamptz", nullable: true })
  claimedAt!: Date | null;

  @Column({ name: "rsvp_id", type: "text", nullable: true })
  rsvpId!: string | null;

  @Column({ name: "created_user_id", type: "text", nullable: true })
  createdUserId!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
