import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("contact_member_submissions")
export class ContactMemberSubmission {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "member_id", type: "text" })
  memberId!: string;

  @Column({ name: "sender_name", type: "text" })
  senderName!: string;

  @Column({ name: "sender_email", type: "text" })
  senderEmail!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "text", default: "new" })
  status!: string;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
