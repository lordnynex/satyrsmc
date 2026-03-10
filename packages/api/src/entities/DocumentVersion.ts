import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("document_versions")
export class DocumentVersion {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "document_id", type: "text" })
  documentId!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "version_number", type: "integer" })
  versionNumber!: number;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
