import { Entity, PrimaryColumn, Column } from "typeorm";
import { ContactEmailType } from "@satyrsmc/shared/lib/enums";

@Entity("contact_emails")
export class ContactEmail {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ type: "text" })
  email!: string;

  @Column({
    type: "enum",
    enum: ContactEmailType,
    enumName: "contact_email_type_enum",
    default: ContactEmailType.Other,
  })
  type!: ContactEmailType;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;
}
