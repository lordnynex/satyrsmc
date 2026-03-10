import { z } from "zod";

// ----- Input schemas -----

export const MailingListGetInputSchema = z.object({ id: z.string() });

export const MailingListCreateInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const MailingListUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const MailingListDeleteInputSchema = z.object({ id: z.string() });

export const MailingListGetMembersInputSchema = z.object({ listId: z.string() });

export const MailingListAddMemberInputSchema = z.object({
  listId: z.string(),
  contactId: z.string(),
});

export const MailingListRemoveMemberInputSchema = z.object({
  listId: z.string(),
  contactId: z.string(),
});

export const MailingListPreviewInputSchema = z.object({ id: z.string() });

export const MailingListGetStatsInputSchema = z.object({ id: z.string() });

export const MailingListGetIncludedInputSchema = z.object({
  listId: z.string(),
  page: z.number(),
  limit: z.number(),
  q: z.string().optional(),
});

// ----- Output entity schemas -----

const MailingListSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  list_type: z.string().optional(),
  delivery_type: z.string().optional(),
  event_id: z.string().nullable().optional(),
  template: z.string().nullable().optional(),
  criteria: z.unknown().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  event: z.object({ id: z.string(), name: z.string() }).optional(),
  member_count: z.number().optional(),
});

const MailingListMemberSchema = z.object({
  id: z.string(),
  list_id: z.string(),
  contact_id: z.string(),
  added_by: z.string().nullable(),
  added_at: z.string(),
  source: z.string().optional(),
  suppressed: z.boolean().optional(),
  suppress_reason: z.string().nullable().optional(),
  unsubscribed: z.boolean().optional(),
  contact: z.unknown().optional(),
});

// ----- Procedure output schemas -----

export const MailingListListOutputSchema = z.array(MailingListSchema);
export const MailingListGetOutputSchema = MailingListSchema;
export const MailingListCreateOutputSchema = MailingListSchema;
export const MailingListUpdateOutputSchema = MailingListSchema;
export const MailingListDeleteOutputSchema = z.object({ ok: z.literal(true) });
export const MailingListGetMembersOutputSchema = z.array(MailingListMemberSchema);
export const MailingListAddMemberOutputSchema = MailingListSchema.nullable();
export const MailingListRemoveMemberOutputSchema = z.object({ ok: z.literal(true) });
export const MailingListPreviewOutputSchema = z.object({
  included: z.array(z.unknown()),
  excluded: z.array(z.unknown()),
  totalIncluded: z.number(),
  totalExcluded: z.number(),
});
export const MailingListGetStatsOutputSchema = z.record(z.unknown());
export const MailingListGetIncludedOutputSchema = z.object({
  contacts: z.array(z.unknown()),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// ----- Inferred output types -----

export type MailingListListOutput = z.infer<typeof MailingListListOutputSchema>;
export type MailingListGetOutput = z.infer<typeof MailingListGetOutputSchema>;
export type MailingListCreateOutput = z.infer<typeof MailingListCreateOutputSchema>;
export type MailingListUpdateOutput = z.infer<typeof MailingListUpdateOutputSchema>;
export type MailingListDeleteOutput = z.infer<typeof MailingListDeleteOutputSchema>;
export type MailingListGetMembersOutput = z.infer<typeof MailingListGetMembersOutputSchema>;
export type MailingListAddMemberOutput = z.infer<typeof MailingListAddMemberOutputSchema>;
export type MailingListRemoveMemberOutput = z.infer<typeof MailingListRemoveMemberOutputSchema>;
export type MailingListPreviewOutput = z.infer<typeof MailingListPreviewOutputSchema>;
export type MailingListGetStatsOutput = z.infer<typeof MailingListGetStatsOutputSchema>;
export type MailingListGetIncludedOutput = z.infer<typeof MailingListGetIncludedOutputSchema>;

// Aliases for API
export type MailingList = MailingListGetOutput;
export type MailingListMember = z.infer<typeof MailingListMemberSchema>;
export type ListPreview = MailingListPreviewOutput;
export type MailingListStats = MailingListGetStatsOutput;
export type MailingListIncludedPage = MailingListGetIncludedOutput;
export type MailingListCriteria = Record<string, unknown> | null;
