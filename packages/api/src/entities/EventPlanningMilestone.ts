import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("event_planning_milestones")
export class EventPlanningMilestone {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "event_id", type: "text" })
  eventId!: string;

  @Column({ type: "integer" })
  month!: number;

  @Column({ type: "integer" })
  year!: number;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @Column({ name: "due_date", type: "timestamptz", nullable: true })
  dueDate!: Date | null;
}
