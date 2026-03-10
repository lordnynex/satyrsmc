import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("event_ride_member_attendees")
export class EventRideMemberAttendee {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "event_id", type: "text" })
  eventId!: string;

  @Column({ name: "member_id", type: "text" })
  memberId!: string;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ name: "waiver_signed", type: "boolean", default: false })
  waiverSigned!: boolean;
}
