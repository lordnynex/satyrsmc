import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("contact_emails")
export class ContactEmail {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ type: "text" })
  email!: string;

  @Column({ type: "text", default: "other" })
  type!: string;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;
}
