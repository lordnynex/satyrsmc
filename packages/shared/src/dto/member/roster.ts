import { z } from "zod";
import { MemberPosition } from "../../lib/enums";

// ----- Input schemas -----

export const RosterListInputSchema = z.object({
  search: z.string().optional(),
  year_joined: z.number().int().min(1900).max(2100).optional(),
  bike_make: z.string().optional(),
  bike_model: z.string().optional(),
  position: z.nativeEnum(MemberPosition).optional(),
});

// ----- Output schemas -----

const RosterBikeSchema = z.object({
  id: z.string(),
  year: z.number(),
  make: z.string(),
  model: z.string(),
  trim: z.string().nullable(),
  has_photo: z.boolean(),
});

const RosterMemberSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  display_name: z.string(),
  username: z.string(),
  position: z.nativeEnum(MemberPosition).nullable(),
  member_since: z.string().nullable(),
  has_photo: z.boolean(),
  photo_thumbnail_url: z.string().nullable(),
  bike: RosterBikeSchema.nullable(),
  phone: z.string().nullable(),
});

const RosterSummarySchema = z.object({
  total: z.number(),
  officers: z.number(),
  regular_members: z.number(),
});

export const RosterListOutputSchema = z.object({
  members: z.array(RosterMemberSchema),
  summary: RosterSummarySchema,
});

export const RosterFilterOptionsOutputSchema = z.object({
  years_joined: z.array(z.number()),
  bike_makes: z.array(z.string()),
  bike_models: z.array(z.string()),
});

// ----- Inferred types -----

export type RosterListInput = z.infer<typeof RosterListInputSchema>;
export type RosterMember = z.infer<typeof RosterMemberSchema>;
export type RosterSummary = z.infer<typeof RosterSummarySchema>;
export type RosterListOutput = z.infer<typeof RosterListOutputSchema>;
export type RosterFilterOptionsOutput = z.infer<typeof RosterFilterOptionsOutputSchema>;
