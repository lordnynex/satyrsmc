import { Entity, PrimaryColumn, Column } from "typeorm";
import { ContactPhoneType } from "@satyrsmc/shared/lib/enums";

@Entity("contact_phones")
export class ContactPhone {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ type: "text" })
  phone!: string;

  @Column({
    type: "enum",
    enum: ContactPhoneType,
    enumName: "contact_phone_type_enum",
    default: ContactPhoneType.Other,
  })
  type!: ContactPhoneType;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;
}
