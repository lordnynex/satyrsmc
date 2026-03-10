import { Entity, PrimaryColumn, Column } from "typeorm";

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
}
