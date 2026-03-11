import { Entity, PrimaryColumn, Column } from "typeorm";
import type { EventType } from "@satyrsmc/shared/lib/enums";

@Entity("events")
export class Event {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "integer", nullable: true })
  year!: number | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "event_date", type: "timestamptz", nullable: true })
  eventDate!: Date | null;

  @Column({ name: "event_url", type: "text", nullable: true })
  eventUrl!: string | null;

  @Column({ name: "event_location", type: "text", nullable: true })
  eventLocation!: string | null;

  @Column({ name: "event_location_embed", type: "text", nullable: true })
  eventLocationEmbed!: string | null;

  @Column({ name: "ga_ticket_cost", type: "real", nullable: true })
  gaTicketCost!: number | null;

  @Column({ name: "day_pass_cost", type: "real", nullable: true })
  dayPassCost!: number | null;

  @Column({ name: "ga_tickets_sold", type: "real", nullable: true })
  gaTicketsSold!: number | null;

  @Column({ name: "day_passes_sold", type: "real", nullable: true })
  dayPassesSold!: number | null;

  @Column({ name: "budget_id", type: "text", nullable: true })
  budgetId!: string | null;

  @Column({ name: "scenario_id", type: "text", nullable: true })
  scenarioId!: string | null;

  @Column({ name: "planning_notes", type: "text", nullable: true })
  planningNotes!: string | null;

  @Column({ name: "event_type", type: "text", default: "badger" })
  eventType!: EventType;

  @Column({ name: "start_location", type: "text", nullable: true })
  startLocation!: string | null;

  @Column({ name: "end_location", type: "text", nullable: true })
  endLocation!: string | null;

  @Column({ name: "facebook_event_url", type: "text", nullable: true })
  facebookEventUrl!: string | null;

  @Column({ name: "pre_ride_event_id", type: "text", nullable: true })
  preRideEventId!: string | null;

  @Column({ name: "ride_cost", type: "real", nullable: true })
  rideCost!: number | null;

  @Column({ name: "show_on_website", type: "boolean", default: false })
  showOnWebsite!: boolean;
}
