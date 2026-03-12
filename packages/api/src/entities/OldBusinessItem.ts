import { Entity, PrimaryColumn, Column } from "typeorm";
import { OldBusinessStatus } from "@satyrsmc/shared/lib/enums";

@Entity("old_business_items")
export class OldBusinessItem {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "meeting_id", type: "text" })
  meetingId!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "enum",
    enum: OldBusinessStatus,
    enumName: "old_business_status_enum",
    default: OldBusinessStatus.Open,
  })
  status!: OldBusinessStatus;

  @Column({ name: "closed_at", type: "timestamptz", nullable: true })
  closedAt!: Date | null;

  @Column({ name: "closed_in_meeting_id", type: "text", nullable: true })
  closedInMeetingId!: string | null;

  @Column({ name: "order_index", type: "integer", default: 0 })
  orderIndex!: number;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
