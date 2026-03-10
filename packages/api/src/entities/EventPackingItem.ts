import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("event_packing_items")
export class EventPackingItem {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "event_id", type: "text" })
  eventId!: string;

  @Column({ name: "category_id", type: "text" })
  categoryId!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ type: "integer", nullable: true })
  quantity!: number | null;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({ type: "boolean", default: false })
  loaded!: boolean;
}
