import { Entity, PrimaryColumn, Column } from "typeorm";
import { MemberPosition } from "@satyrsmc/shared/lib/enums";

@Entity("members")
export class Member {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ name: "member_since", type: "timestamptz", nullable: true })
  memberSince!: Date | null;

  @Column({ name: "is_baby", type: "boolean", default: false })
  isBaby!: boolean;

  @Column({ type: "enum", enum: MemberPosition, enumName: "member_position_enum", nullable: true })
  position!: MemberPosition | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "show_on_website", type: "boolean", default: false })
  showOnWebsite!: boolean;
}
