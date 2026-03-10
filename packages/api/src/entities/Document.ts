import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("documents")
export class Document {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
