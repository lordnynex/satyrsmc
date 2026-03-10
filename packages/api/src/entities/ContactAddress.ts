import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("contact_addresses")
export class ContactAddress {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ name: "address_line1", type: "text", nullable: true })
  addressLine1!: string | null;

  @Column({ name: "address_line2", type: "text", nullable: true })
  addressLine2!: string | null;

  @Column({ type: "text", nullable: true })
  city!: string | null;

  @Column({ type: "text", nullable: true })
  state!: string | null;

  @Column({ name: "postal_code", type: "text", nullable: true })
  postalCode!: string | null;

  @Column({ type: "text", default: "US" })
  country!: string;

  @Column({ type: "text", default: "home" })
  type!: string;

  @Column({ name: "is_primary_mailing", type: "boolean", default: false })
  isPrimaryMailing!: boolean;
}
