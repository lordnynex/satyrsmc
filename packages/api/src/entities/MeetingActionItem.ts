import { Entity, PrimaryColumn, Column } from "typeorm";

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

  @Column({ name: "due_date", type: "text", nullable: true })
  dueDate!: string | null;

  @Column({ type: "text", default: "open" })
  status!: "open" | "completed";

  @Column({ name: "completed_at", type: "text", nullable: true })
  completedAt!: string | null;

  @Column({ name: "order_index", type: "integer", default: 0 })
  orderIndex!: number;

  @Column({ name: "created_at", type: "text", nullable: true })
  createdAt!: string | null;
}
