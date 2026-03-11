import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("incidents")
export class Incident {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "event_id", type: "text" })
  eventId!: string;

  @Column({ name: "contact_id", type: "text", nullable: true })
  contactId!: string | null;

  @Column({ name: "member_id", type: "text", nullable: true })
  memberId!: string | null;

  @Column("text")
  type!: string;

  @Column("text")
  severity!: string;

  @Column("text")
  summary!: string;

  @Column({ type: "text", nullable: true })
  details!: string | null;

  @Column({ name: "occurred_at", type: "timestamptz", nullable: true })
  occurredAt!: Date | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
