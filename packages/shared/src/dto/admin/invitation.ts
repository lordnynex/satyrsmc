import { z } from "zod";
import { InvitationPurpose } from "../../lib/enums";

// --- Input schemas ---

export const CreateInvitationInputSchema = z.object({
  contactId: z.string().optional(),
  purpose: z.nativeEnum(InvitationPurpose),
  eventId: z.string().optional(),
  expiresInDays: z.number().default(30),
});
export type CreateInvitationInput = z.infer<typeof CreateInvitationInputSchema>;

export const GenerateAccountInvitationsInputSchema = z.object({
  contactIds: z.array(z.string()).min(1),
  expiresInDays: z.number().default(30),
});
export type GenerateAccountInvitationsInput = z.infer<typeof GenerateAccountInvitationsInputSchema>;

// --- Output schemas ---

export const InvitationOutputSchema = z.object({
  id: z.string(),
  contactId: z.string().nullable(),
  eventId: z.string().nullable(),
  purpose: z.nativeEnum(InvitationPurpose),
  expiresAt: z.string(),
  claimedAt: z.string().nullable(),
  rsvpId: z.string().nullable(),
  createdUserId: z.string().nullable(),
  createdAt: z.string().nullable(),
  rawToken: z.string().optional(),
});
export type InvitationOutput = z.infer<typeof InvitationOutputSchema>;

export const ValidateTokenOutputSchema = z.discriminatedUnion("valid", [
  z.object({
    valid: z.literal(true),
    purpose: z.nativeEnum(InvitationPurpose),
    contact: z
      .object({
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
      })
      .nullable(),
    event: z
      .object({
        id: z.string(),
        name: z.string(),
        startDate: z.string().nullable(),
        gaTicketCost: z.number().nullable(),
      })
      .nullable(),
  }),
  z.object({
    valid: z.literal(false),
    reason: z.enum(["expired", "claimed", "not_found"]),
  }),
]);
export type ValidateTokenOutput = z.infer<typeof ValidateTokenOutputSchema>;
