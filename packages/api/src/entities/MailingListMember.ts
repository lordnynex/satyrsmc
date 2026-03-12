import { Entity, PrimaryColumn, Column } from "typeorm";
import { MailingMemberSource } from "@satyrsmc/shared/lib/enums";

@Entity("mailing_list_members")
export class MailingListMember {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "list_id", type: "text" })
  listId!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ name: "added_by", type: "text", nullable: true })
  addedBy!: string | null;

  @Column({ name: "added_at", type: "timestamptz", nullable: true })
  addedAt!: Date | null;

  @Column({
    type: "enum",
    enum: MailingMemberSource,
    enumName: "mailing_member_source_enum",
    default: MailingMemberSource.Manual,
  })
  source!: MailingMemberSource;

  @Column({ type: "boolean", default: false })
  suppressed!: boolean;

  @Column({ name: "suppress_reason", type: "text", nullable: true })
  suppressReason!: string | null;

  @Column({ type: "boolean", default: false })
  unsubscribed!: boolean;
}
