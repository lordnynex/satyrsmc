import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("contact_submissions")
export class ContactSubmission {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text" })
  email!: string;

  @Column({ type: "text", nullable: true })
  subject!: string | null;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "text", default: "new" })
  status!: string;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
