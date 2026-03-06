import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("meeting_motions")
export class MeetingMotion {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "meeting_id", type: "text" })
  meetingId!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text" })
  result!: "pass" | "fail";

  @Column({ name: "mover_member_id", type: "text", nullable: true })
  moverMemberId!: string | null;

  @Column({ name: "seconder_member_id", type: "text", nullable: true })
  seconderMemberId!: string | null;

  @Column({ name: "order_index", type: "integer", default: 0 })
  orderIndex!: number;

  @Column({ name: "created_at", type: "text", nullable: true })
  createdAt!: string | null;
}
