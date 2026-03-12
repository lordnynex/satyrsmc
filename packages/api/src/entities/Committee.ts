import { Entity, PrimaryColumn, Column } from "typeorm";
import { CommitteeStatus } from "@satyrsmc/shared/lib/enums";

@Entity("committees")
export class Committee {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", nullable: true })
  purpose!: string | null;

  @Column({ name: "formed_date", type: "timestamptz" })
  formedDate!: Date;

  @Column({ name: "closed_date", type: "timestamptz", nullable: true })
  closedDate!: Date | null;

  @Column({ name: "chairperson_member_id", type: "text", nullable: true })
  chairpersonMemberId!: string | null;

  @Column({ type: "enum", enum: CommitteeStatus, enumName: "committee_status_enum" })
  status!: CommitteeStatus;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
