import { z } from "zod";

// ----- Input schemas -----

export const IncidentListInputSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    per_page: z.number().int().min(1).max(100).default(20),
  })
  .optional();

// ----- Output entity schemas -----

const IncidentSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  contact_id: z.string().nullable(),
  member_id: z.string().nullable(),
  type: z.string(),
  severity: z.string(),
  summary: z.string(),
  details: z.string().nullable(),
  occurred_at: z.string().nullable(),
  created_at: z.string().optional(),
  contact: z.unknown().optional(),
  member: z.unknown().optional(),
  event_name: z.string().optional(),
  event_type: z.string().optional(),
});

// ----- Procedure output schemas -----

export const IncidentListOutputSchema = z.object({
  items: z.array(IncidentSchema),
  page: z.number(),
  per_page: z.number(),
  total: z.number(),
});

// ----- Inferred output types -----

export type IncidentListOutput = z.infer<typeof IncidentListOutputSchema>;
