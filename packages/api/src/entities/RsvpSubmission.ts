import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("rsvp_submissions")
export class RsvpSubmission {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "rsvp_id", type: "text", unique: true })
  rsvpId!: string;

  @Column({ name: "first_name", type: "text" })
  firstName!: string;

  @Column({ name: "last_name", type: "text" })
  lastName!: string;

  @Column({ type: "text" })
  email!: string;

  @Column({ type: "text" })
  phone!: string;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  zip!: string | null;

  @Column({ name: "emergency_contact_name", type: "text" })
  emergencyContactName!: string;

  @Column({ name: "emergency_contact_phone", type: "text" })
  emergencyContactPhone!: string;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
