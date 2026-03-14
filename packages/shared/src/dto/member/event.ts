import { z } from "zod";
import { EventType, RsvpStatus } from "../../lib/enums";

// ----- Input schemas -----

export const MemberEventListInputSchema = z.object({
  event_type: z.nativeEnum(EventType).optional(),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  upcoming: z.boolean().default(true),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(18),
});

export const MemberEventRsvpInputSchema = z.object({
  eventId: z.string(),
  status: z.nativeEnum(RsvpStatus),
});

// ----- Output schemas -----

export const MemberEventCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  event_date: z.string().nullable(),
  event_type: z.nativeEnum(EventType),
  event_location: z.string().nullable(),
  photo_url: z.string().nullable(),
  rsvp_yes_count: z.number(),
  my_rsvp: z.nativeEnum(RsvpStatus).nullable(),
  members_only: z.boolean(),
});

export const MemberEventListOutputSchema = z.object({
  items: z.array(MemberEventCardSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
});

export const MemberEventRsvpOutputSchema = z.object({
  ok: z.literal(true),
  status: z.nativeEnum(RsvpStatus),
});

// ----- Inferred types -----

export type MemberEventListInput = z.infer<typeof MemberEventListInputSchema>;
export type MemberEventCard = z.infer<typeof MemberEventCardSchema>;
export type MemberEventListOutput = z.infer<typeof MemberEventListOutputSchema>;
export type MemberEventRsvpInput = z.infer<typeof MemberEventRsvpInputSchema>;
export type MemberEventRsvpOutput = z.infer<typeof MemberEventRsvpOutputSchema>;
