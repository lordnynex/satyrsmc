import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("meeting_templates")
export class MeetingTemplate {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text" })
  type!: string;

  @Column({ name: "document_id", type: "text" })
  documentId!: string;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
