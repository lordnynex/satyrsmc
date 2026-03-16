import { z } from "zod";
import { ActivityMessageCode } from "../../lib/enums";

// ----- Input schemas -----

export const MyActivityLogListInputSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    per_page: z.number().int().min(1).max(100).default(20),
  })
  .optional();

// ----- Output schemas -----

const ActivityLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  message_code: z.nativeEnum(ActivityMessageCode),
  reference_id: z.string().nullable(),
  reference_type: z.string().nullable(),
  created_at: z.string(),
});

export const MyActivityLogListOutputSchema = z.object({
  items: z.array(ActivityLogSchema),
  page: z.number(),
  per_page: z.number(),
  total: z.number(),
});

export type MyActivityLogListInput = z.infer<typeof MyActivityLogListInputSchema>;
export type MyActivityLogListOutput = z.infer<typeof MyActivityLogListOutputSchema>;
