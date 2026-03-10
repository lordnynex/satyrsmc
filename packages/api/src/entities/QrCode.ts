import { Entity, PrimaryColumn, Column } from "typeorm";

export interface QrCodeConfig {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  width?: number;
  margin?: number;
  color?: { dark?: string; light?: string };
  format?: "png" | "svg";
}

@Entity("qr_codes")
export class QrCode {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text", nullable: true })
  name!: string | null;

  @Column({ type: "text" })
  url!: string;

  @Column({ type: "text", nullable: true })
  config!: string | null;

  @Column({ name: "image_data", type: "bytea", nullable: true })
  imageData!: Buffer | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
