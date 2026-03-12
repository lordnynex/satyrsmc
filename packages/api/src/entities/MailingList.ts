import { Entity, PrimaryColumn, Column } from "typeorm";
import { MailingListType, MailingDeliveryType } from "@satyrsmc/shared/lib/enums";

@Entity("mailing_lists")
export class MailingList {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    name: "list_type",
    type: "enum",
    enum: MailingListType,
    enumName: "mailing_list_type_enum",
    default: MailingListType.Static,
  })
  listType!: MailingListType;

  @Column({
    name: "delivery_type",
    type: "enum",
    enum: MailingDeliveryType,
    enumName: "mailing_delivery_type_enum",
    default: MailingDeliveryType.Both,
  })
  deliveryType!: MailingDeliveryType;

  @Column({ name: "event_id", type: "text", nullable: true })
  eventId!: string | null;

  @Column({ type: "text", nullable: true })
  template!: string | null;

  @Column({ type: "text", nullable: true })
  criteria!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
