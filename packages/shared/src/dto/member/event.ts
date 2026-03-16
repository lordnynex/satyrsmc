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
  waiver_signed: z.boolean().optional(),
});

export const MemberEventGetInputSchema = z.object({
  id: z.string(),
});

// ----- Output schemas -----

export const MemberEventCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  start_date: z.string().nullable(),
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

// ----- Detail schemas -----

export const MemberEventAttendeeSchema = z.object({
  contact_id: z.string(),
  display_name: z.string(),
  photo_thumbnail_url: z.string().nullable(),
  is_member: z.boolean(),
  sort_order: z.number(),
});

export const MemberEventScheduleItemSchema = z.object({
  id: z.string(),
  scheduled_time: z.string(),
  label: z.string(),
  location: z.string().nullable(),
  sort_order: z.number(),
});

export const MemberEventPhotoSchema = z.object({
  id: z.string(),
  photo_display_url: z.string(),
  sort_order: z.number(),
});

export const MemberEventDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  event_type: z.nativeEnum(EventType),
  event_location: z.string().nullable(),
  event_location_embed: z.string().nullable(),
  event_url: z.string().nullable(),
  ga_ticket_cost: z.number().nullable(),
  day_pass_cost: z.number().nullable(),
  members_only: z.boolean(),
  start_location: z.string().nullable(),
  end_location: z.string().nullable(),
  host_ids: z.array(z.string()),
  my_rsvp: z.nativeEnum(RsvpStatus).nullable(),
  rsvp_yes_count: z.number(),
  photos: z.array(MemberEventPhotoSchema),
  attendees: z.array(MemberEventAttendeeSchema),
  schedule_items: z.array(MemberEventScheduleItemSchema),
});

export const MemberEventGetOutputSchema = MemberEventDetailSchema;

// ----- Inferred types -----

export type MemberEventListInput = z.infer<typeof MemberEventListInputSchema>;
export type MemberEventCard = z.infer<typeof MemberEventCardSchema>;
export type MemberEventListOutput = z.infer<typeof MemberEventListOutputSchema>;
export type MemberEventRsvpInput = z.infer<typeof MemberEventRsvpInputSchema>;
export type MemberEventRsvpOutput = z.infer<typeof MemberEventRsvpOutputSchema>;
export type MemberEventGetInput = z.infer<typeof MemberEventGetInputSchema>;
export type MemberEventDetail = z.infer<typeof MemberEventDetailSchema>;
export type MemberEventAttendee = z.infer<typeof MemberEventAttendeeSchema>;
export type MemberEventScheduleItem = z.infer<typeof MemberEventScheduleItemSchema>;
export type MemberEventPhoto = z.infer<typeof MemberEventPhotoSchema>;
export type MemberEventGetOutput = z.infer<typeof MemberEventGetOutputSchema>;
