import { Entity, PrimaryColumn, Column } from "typeorm";
import { TshirtSize, TravelMode } from "@satyrsmc/shared/lib/enums";
import type {
  TshirtSize as TshirtSizeType,
  TravelMode as TravelModeType,
} from "@satyrsmc/shared/lib/enums";

@Entity("badger_registrations")
export class BadgerRegistration {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "rsvp_id", type: "text", unique: true })
  rsvpId!: string;

  @Column({
    name: "tshirt_size",
    type: "enum",
    enum: TshirtSize,
    enumName: "tshirt_size_enum",
  })
  tshirtSize!: TshirtSizeType;

  @Column({
    name: "traveling_by",
    type: "enum",
    enum: TravelMode,
    enumName: "travel_mode_enum",
  })
  travelingBy!: TravelModeType;

  @Column({ type: "text", nullable: true })
  club!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
