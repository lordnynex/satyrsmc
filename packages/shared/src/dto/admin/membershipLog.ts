import { z } from "zod";
import { MembershipMessageCode } from "../../lib/enums";

// ----- Input schemas -----

export const MembershipLogListInputSchema = z.object({
  user_id: z.string(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

export const MembershipLogCreateInputSchema = z.object({
  user_id: z.string(),
  message_code: z.nativeEnum(MembershipMessageCode),
  message: z.string().optional(),
});

// ----- Output schemas -----

const MembershipLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  logged_by: z.string().nullable(),
  message_code: z.nativeEnum(MembershipMessageCode),
  message: z.string().nullable(),
  created_at: z.string(),
});

export const MembershipLogListOutputSchema = z.object({
  items: z.array(MembershipLogSchema),
  page: z.number(),
  per_page: z.number(),
  total: z.number(),
});

export const MembershipLogCreateOutputSchema = MembershipLogSchema;

export type MembershipLogListInput = z.infer<typeof MembershipLogListInputSchema>;
export type MembershipLogListOutput = z.infer<typeof MembershipLogListOutputSchema>;
export type MembershipLogCreateInput = z.infer<typeof MembershipLogCreateInputSchema>;
export type MembershipLogCreateOutput = z.infer<typeof MembershipLogCreateOutputSchema>;
