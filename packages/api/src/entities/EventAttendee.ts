import { Entity, PrimaryColumn, Column } from "typeorm";
import type { RsvpStatus } from "@satyrsmc/shared/lib/enums";

@Entity("event_attendees")
export class EventAttendee {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "event_id", type: "text" })
  eventId!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ name: "waiver_signed", type: "boolean", default: false })
  waiverSigned!: boolean;

  @Column({ name: "rsvp_status", type: "text", default: "no_response" })
  rsvpStatus!: RsvpStatus;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: string | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: string | null;
}
