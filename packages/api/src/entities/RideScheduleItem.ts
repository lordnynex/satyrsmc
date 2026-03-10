import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("ride_schedule_items")
export class RideScheduleItem {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "event_id", type: "text" })
  eventId!: string;

  @Column({ name: "scheduled_time", type: "timestamptz" })
  scheduledTime!: Date;

  @Column("text")
  label!: string;

  @Column({ type: "text", nullable: true })
  location!: string | null;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;
}
