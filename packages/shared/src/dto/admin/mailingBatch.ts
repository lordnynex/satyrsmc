import { z } from "zod";

// ----- Input schemas -----

export const MailingBatchGetInputSchema = z.object({ id: z.string() });

export const MailingBatchCreateInputSchema = z.object({
  listId: z.string(),
  name: z.string(),
});

export const MailingBatchUpdateRecipientStatusInputSchema = z.object({
  batchId: z.string(),
  recipientId: z.string(),
  status: z.string(),
  reason: z.string().optional(),
});

// ----- Output entity schemas -----

const MailingBatchRecipientSchema = z.object({
  id: z.string(),
  batch_id: z.string(),
  contact_id: z.string(),
  snapshot_name: z.string(),
  snapshot_address_line1: z.string().nullable(),
  snapshot_address_line2: z.string().nullable(),
  snapshot_city: z.string().nullable(),
  snapshot_state: z.string().nullable(),
  snapshot_postal_code: z.string().nullable(),
  snapshot_country: z.string().nullable(),
  snapshot_organization: z.string().nullable(),
  status: z.string(),
  invalid_reason: z.string().nullable(),
  returned_reason: z.string().nullable(),
});

const MailingBatchSchema = z.object({
  id: z.string(),
  list_id: z.string(),
  event_id: z.string().nullable(),
  name: z.string(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  recipient_count: z.number(),
  list: z.unknown().optional(),
  event: z.object({ id: z.string(), name: z.string() }).optional(),
  recipients: z.array(MailingBatchRecipientSchema).optional(),
});

// ----- Procedure output schemas -----

export const MailingBatchListOutputSchema = z.array(MailingBatchSchema);
export const MailingBatchGetOutputSchema = MailingBatchSchema;
export const MailingBatchCreateOutputSchema = MailingBatchSchema;
export const MailingBatchUpdateRecipientStatusOutputSchema = z.object({ ok: z.literal(true) });

// ----- Inferred output types -----

export type MailingBatchListOutput = z.infer<typeof MailingBatchListOutputSchema>;
export type MailingBatchGetOutput = z.infer<typeof MailingBatchGetOutputSchema>;
export type MailingBatchCreateOutput = z.infer<typeof MailingBatchCreateOutputSchema>;
export type MailingBatchUpdateRecipientStatusOutput = z.infer<typeof MailingBatchUpdateRecipientStatusOutputSchema>;

// Aliases for API
export type MailingBatch = MailingBatchGetOutput;
export type MailingBatchRecipient = z.infer<typeof MailingBatchRecipientSchema>;
