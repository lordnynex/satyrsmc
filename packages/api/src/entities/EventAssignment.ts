import { Entity, PrimaryColumn, Column } from "typeorm";
import { EventAssignmentCategory } from "@satyrsmc/shared/lib/enums";

@Entity("event_assignments")
export class EventAssignment {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "event_id", type: "text" })
  eventId!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({
    type: "enum",
    enum: EventAssignmentCategory,
    enumName: "event_assignment_category_enum",
  })
  category!: EventAssignmentCategory;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;
}
