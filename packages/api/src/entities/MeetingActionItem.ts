import { Entity, PrimaryColumn, Column } from "typeorm";
import { ActionItemStatus } from "@satyrsmc/shared/lib/enums";

@Entity("meeting_action_items")
export class MeetingActionItem {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "meeting_id", type: "text" })
  meetingId!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "assignee_member_id", type: "text", nullable: true })
  assigneeMemberId!: string | null;

  @Column({ name: "due_date", type: "timestamptz", nullable: true })
  dueDate!: Date | null;

  @Column({
    type: "enum",
    enum: ActionItemStatus,
    enumName: "action_item_status_enum",
    default: ActionItemStatus.Open,
  })
  status!: ActionItemStatus;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt!: Date | null;

  @Column({ name: "order_index", type: "integer", default: 0 })
  orderIndex!: number;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
