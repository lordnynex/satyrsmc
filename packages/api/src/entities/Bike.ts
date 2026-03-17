import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("bikes")
export class Bike {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "user_id", type: "text" })
  userId!: string;

  @Column({ type: "integer" })
  year!: number;

  @Column({ type: "text" })
  make!: string;

  @Column({ type: "text" })
  model!: string;

  @Column({ type: "text", nullable: true })
  trim!: string | null;

  @Column({ type: "text", nullable: true })
  mods!: string | null;

  @Column({ type: "bytea", nullable: true })
  photo!: Buffer | null;

  @Column({ name: "photo_thumbnail", type: "bytea", nullable: true })
  photoThumbnail!: Buffer | null;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
