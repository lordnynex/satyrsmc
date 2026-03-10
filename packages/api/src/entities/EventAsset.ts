import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("event_assets")
export class EventAsset {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "event_id", type: "text" })
  eventId!: string;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ type: "bytea", nullable: true })
  photo!: Buffer | null;

  @Column({ name: "photo_thumbnail", type: "bytea", nullable: true })
  photoThumbnail!: Buffer | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
