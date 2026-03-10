import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("budgets")
export class Budget {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "integer" })
  year!: number;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
