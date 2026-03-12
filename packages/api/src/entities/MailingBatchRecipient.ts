import { Entity, PrimaryColumn, Column } from "typeorm";
import { MailingRecipientStatus } from "@satyrsmc/shared/lib/enums";

@Entity("mailing_batch_recipients")
export class MailingBatchRecipient {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "batch_id", type: "text" })
  batchId!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ name: "snapshot_name", type: "text" })
  snapshotName!: string;

  @Column({ name: "snapshot_address_line1", type: "text", nullable: true })
  snapshotAddressLine1!: string | null;

  @Column({ name: "snapshot_address_line2", type: "text", nullable: true })
  snapshotAddressLine2!: string | null;

  @Column({ name: "snapshot_city", type: "text", nullable: true })
  snapshotCity!: string | null;

  @Column({ name: "snapshot_state", type: "text", nullable: true })
  snapshotState!: string | null;

  @Column({ name: "snapshot_postal_code", type: "text", nullable: true })
  snapshotPostalCode!: string | null;

  @Column({ name: "snapshot_country", type: "text", nullable: true })
  snapshotCountry!: string | null;

  @Column({ name: "snapshot_organization", type: "text", nullable: true })
  snapshotOrganization!: string | null;

  @Column({
    type: "enum",
    enum: MailingRecipientStatus,
    enumName: "mailing_recipient_status_enum",
    default: MailingRecipientStatus.Queued,
  })
  status!: MailingRecipientStatus;

  @Column({ name: "invalid_reason", type: "text", nullable: true })
  invalidReason!: string | null;

  @Column({ name: "returned_reason", type: "text", nullable: true })
  returnedReason!: string | null;
}
