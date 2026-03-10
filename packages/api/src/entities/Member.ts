import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("members")
export class Member {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "phone_number", type: "text", nullable: true })
  phoneNumber!: string | null;

  @Column({ type: "text", nullable: true })
  email!: string | null;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  birthday!: Date | null;

  @Column({ name: "member_since", type: "timestamptz", nullable: true })
  memberSince!: Date | null;

  @Column({ name: "is_baby", type: "boolean", default: false })
  isBaby!: boolean;

  @Column({ type: "text", nullable: true })
  position!: string | null;

  @Column({ name: "emergency_contact_name", type: "text", nullable: true })
  emergencyContactName!: string | null;

  @Column({ name: "emergency_contact_phone", type: "text", nullable: true })
  emergencyContactPhone!: string | null;

  @Column({ type: "bytea", nullable: true })
  photo!: Buffer | null;

  @Column({ name: "photo_thumbnail", type: "bytea", nullable: true })
  photoThumbnail!: Buffer | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "show_on_website", type: "boolean", default: false })
  showOnWebsite!: boolean;
}
