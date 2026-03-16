import { z } from "zod";
import { ActivityMessageCode } from "../../lib/enums";

// ----- Input schemas -----

export const ActivityLogListInputSchema = z
  .object({
    user_id: z.string().optional(),
    page: z.number().int().min(1).default(1),
    per_page: z.number().int().min(1).max(100).default(20),
  })
  .optional();

export const ActivityLogCreateInputSchema = z.object({
  user_id: z.string(),
  message_code: z.nativeEnum(ActivityMessageCode),
  reference_id: z.string().optional(),
  reference_type: z.string().optional(),
});

// ----- Output schemas -----

const ActivityLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  message_code: z.nativeEnum(ActivityMessageCode),
  reference_id: z.string().nullable(),
  reference_type: z.string().nullable(),
  created_at: z.string(),
});

export const ActivityLogListOutputSchema = z.object({
  items: z.array(ActivityLogSchema),
  page: z.number(),
  per_page: z.number(),
  total: z.number(),
});

export const ActivityLogCreateOutputSchema = ActivityLogSchema;

export type ActivityLogListInput = z.infer<typeof ActivityLogListInputSchema>;
export type ActivityLogListOutput = z.infer<typeof ActivityLogListOutputSchema>;
export type ActivityLogCreateInput = z.infer<typeof ActivityLogCreateInputSchema>;
export type ActivityLogCreateOutput = z.infer<typeof ActivityLogCreateOutputSchema>;
