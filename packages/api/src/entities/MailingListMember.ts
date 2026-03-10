import { Entity, PrimaryColumn, Column } from "typeorm";

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

  @Column({ type: "text", default: "manual" })
  source!: string;

  @Column({ type: "boolean", default: false })
  suppressed!: boolean;

  @Column({ name: "suppress_reason", type: "text", nullable: true })
  suppressReason!: string | null;

  @Column({ type: "boolean", default: false })
  unsubscribed!: boolean;
}
