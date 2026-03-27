import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("waiver_versions")
export class WaiverVersion {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "integer" })
  version!: number;

  @Column({ name: "content_hash", type: "text" })
  contentHash!: string;

  @Column({ name: "effective_at", type: "timestamptz" })
  effectiveAt!: Date;

  @Column({ name: "retired_at", type: "timestamptz", nullable: true })
  retiredAt!: Date | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
