import { Entity, PrimaryColumn, Column } from "typeorm";
import { ACTIVITY_MESSAGE_CODES } from "@satyrsmc/shared/lib/enums";
import type { ActivityMessageCode } from "@satyrsmc/shared/lib/enums";

@Entity("activity_logs")
export class ActivityLog {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "user_id", type: "text" })
  userId!: string;

  @Column({
    name: "message_code",
    type: "enum",
    enum: ACTIVITY_MESSAGE_CODES,
    enumName: "activity_message_code_enum",
  })
  messageCode!: ActivityMessageCode;

  @Column({ name: "reference_id", type: "text", nullable: true })
  referenceId!: string | null;

  @Column({ name: "reference_type", type: "text", nullable: true })
  referenceType!: string | null;

  @Column({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
