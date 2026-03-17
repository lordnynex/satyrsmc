import { z } from "zod";

// ----- Output schemas -----

export const MailingListSubscriptionSchema = z.object({
  list_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  unsubscribed: z.boolean(),
});

export const NotificationPreferencesOutputSchema = z.object({
  mailing_lists: z.array(MailingListSubscriptionSchema),
});

// ----- Input schemas -----

export const ToggleMailingListInputSchema = z.object({
  list_id: z.string().min(1, "List ID is required"),
  unsubscribed: z.boolean(),
});

export const ToggleMailingListOutputSchema = z.object({
  success: z.boolean(),
});

// ----- Inferred types -----

export type MailingListSubscription = z.infer<typeof MailingListSubscriptionSchema>;
export type NotificationPreferencesOutput = z.infer<typeof NotificationPreferencesOutputSchema>;
export type ToggleMailingListInput = z.infer<typeof ToggleMailingListInputSchema>;
export type ToggleMailingListOutput = z.infer<typeof ToggleMailingListOutputSchema>;
