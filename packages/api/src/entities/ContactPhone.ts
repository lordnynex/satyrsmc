import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("contact_phones")
export class ContactPhone {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ type: "text" })
  phone!: string;

  @Column({ type: "text", default: "other" })
  type!: string;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;
}
