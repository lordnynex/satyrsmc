import { Entity, PrimaryColumn, Column } from "typeorm";
import type { MeetingTemplateType } from "@satyrsmc/shared/lib/enums";

@Entity("meeting_templates")
export class MeetingTemplate {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text" })
  type!: MeetingTemplateType;

  @Column({ name: "document_id", type: "text" })
  documentId!: string;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
