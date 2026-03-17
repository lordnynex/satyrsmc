import { Entity, PrimaryColumn, Column } from "typeorm";
import { MEMBERSHIP_MESSAGE_CODES } from "@satyrsmc/shared/lib/enums";
import type { MembershipMessageCode } from "@satyrsmc/shared/lib/enums";

@Entity("membership_logs")
export class MembershipLog {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "user_id", type: "text" })
  userId!: string;

  @Column({ name: "logged_by", type: "text", nullable: true })
  loggedBy!: string | null;

  @Column({
    name: "message_code",
    type: "enum",
    enum: MEMBERSHIP_MESSAGE_CODES,
    enumName: "membership_message_code_enum",
  })
  messageCode!: MembershipMessageCode;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  @Column({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
