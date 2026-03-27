import { Entity, PrimaryColumn, Column } from "typeorm";
import { RsvpLogCode } from "@satyrsmc/shared/lib/enums";
import type { RsvpLogCode as RsvpLogCodeType } from "@satyrsmc/shared/lib/enums";

@Entity("rsvp_logs")
export class RsvpLog {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "rsvp_id", type: "text" })
  rsvpId!: string;

  @Column({ name: "logged_by", type: "text", nullable: true })
  loggedBy!: string | null;

  @Column({
    name: "message_code",
    type: "enum",
    enum: RsvpLogCode,
    enumName: "rsvp_log_code_enum",
  })
  messageCode!: RsvpLogCodeType;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  @Column({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
