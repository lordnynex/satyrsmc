import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("mailing_batches")
export class MailingBatch {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "list_id", type: "text" })
  listId!: string;

  @Column({ name: "event_id", type: "text", nullable: true })
  eventId!: string | null;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "created_by", type: "text", nullable: true })
  createdBy!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "recipient_count", type: "integer", default: 0 })
  recipientCount!: number;
}
