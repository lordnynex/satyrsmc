import { Entity, PrimaryColumn, Column } from "typeorm";
import type { ContactType, ContactStatus, ConsentStatus } from "@satyrsmc/shared/lib/enums";

@Entity("contacts")
export class Contact {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text", default: "person" })
  type!: ContactType;

  @Column({ type: "text", default: "active" })
  status!: ContactStatus;

  @Column({ name: "display_name", type: "text" })
  displayName!: string;

  @Column({ name: "first_name", type: "text", nullable: true })
  firstName!: string | null;

  @Column({ name: "last_name", type: "text", nullable: true })
  lastName!: string | null;

  @Column({ name: "organization_name", type: "text", nullable: true })
  organizationName!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "how_we_know_them", type: "text", nullable: true })
  howWeKnowThem!: string | null;

  @Column({ name: "ok_to_email", type: "text", default: "unknown" })
  okToEmail!: ConsentStatus;

  @Column({ name: "ok_to_mail", type: "text", default: "unknown" })
  okToMail!: ConsentStatus;

  @Column({ name: "ok_to_sms", type: "text", default: "unknown" })
  okToSms!: ConsentStatus;

  @Column({ name: "do_not_contact", type: "boolean", default: false })
  doNotContact!: boolean;

  @Column({ name: "club_name", type: "text", nullable: true })
  clubName!: string | null;

  @Column({ type: "text", nullable: true })
  role!: string | null;

  @Column({ type: "text", nullable: true, unique: true })
  uid!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;

  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @Column({ name: "hellenic", type: "boolean", default: false })
  hellenic!: boolean;

  @Column({ name: "deceased", type: "boolean", default: false })
  deceased!: boolean;

  @Column({ name: "deceased_year", type: "integer", nullable: true })
  deceasedYear!: number | null;
}
