import { z } from "zod";
import { t, adminProcedure } from "../../trpc";
import {
  CreateInvitationInputSchema,
  GenerateAccountInvitationsInputSchema,
} from "@satyrsmc/shared/dto/admin/invitation";
import { InvitationPurpose } from "@satyrsmc/shared/lib/enums";

export const adminInvitationRouter = t.router({
  /**
   * Public: validate a token (used by invitation landing pages).
   */
  validate: t.procedure
    .input(z.object({ token: z.string() }))
    .meta({ description: "Validate an invitation token." })
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.api.invitations.findByRawToken(input.token);

      if (!invitation) {
        return { valid: false as const, reason: "not_found" as const };
      }
      if (invitation.expiresAt < new Date()) {
        return { valid: false as const, reason: "expired" as const };
      }
      // Per-contact invitations are single-use
      if (invitation.purpose !== InvitationPurpose.EventOpenRegistration && invitation.claimedAt) {
        return { valid: false as const, reason: "claimed" as const };
      }

      // Fetch contact info if tied to a contact
      let contact: {
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
      } | null = null;

      if (invitation.contactId) {
        const contactData = await ctx.api.contacts.get(invitation.contactId);
        if (contactData) {
          const primaryEmail = contactData.emails?.find((e) => e.is_primary)?.email ?? null;
          const primaryPhone = contactData.phones?.find((p) => p.is_primary)?.phone ?? null;
          contact = {
            firstName: contactData.first_name ?? null,
            lastName: contactData.last_name ?? null,
            email: primaryEmail,
            phone: primaryPhone,
          };
        }
      }

      // Fetch event info if tied to an event
      let event: {
        id: string;
        name: string;
        startDate: string | null;
        gaTicketCost: number | null;
      } | null = null;

      if (invitation.eventId) {
        const eventData = await ctx.api.events.get(invitation.eventId);
        if (eventData) {
          event = {
            id: eventData.id,
            name: eventData.name,
            startDate: eventData.start_date ?? null,
            gaTicketCost: eventData.ga_ticket_cost ?? null,
          };
        }
      }

      return {
        valid: true as const,
        purpose: invitation.purpose,
        contact,
        event,
      };
    }),

  /**
   * Admin: create an invitation for a contact.
   */
  createForContact: adminProcedure
    .input(CreateInvitationInputSchema)
    .meta({ description: "Create an invitation for a contact." })
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.api.invitations.create({
        contactId: input.contactId,
        purpose: input.purpose,
        eventId: input.eventId,
        createdByUserId: ctx.session.userId,
        expiresInDays: input.expiresInDays,
      });
      return result;
    }),

  /**
   * Admin: bulk account setup invitations.
   */
  generateForAccountSetup: adminProcedure
    .input(GenerateAccountInvitationsInputSchema)
    .meta({ description: "Generate account setup invitations for multiple contacts." })
    .mutation(async ({ ctx, input }) => {
      const results = [];
      for (const contactId of input.contactIds) {
        const result = await ctx.api.invitations.create({
          contactId,
          purpose: InvitationPurpose.AccountSetup,
          createdByUserId: ctx.session.userId,
          expiresInDays: input.expiresInDays,
        });
        results.push(result);
      }
      return results;
    }),

  /**
   * Admin: list invitations for an event.
   */
  listByEvent: adminProcedure
    .input(z.object({ eventId: z.string() }))
    .meta({ description: "List invitations for an event." })
    .query(async ({ ctx, input }) => ctx.api.invitations.findByEvent(input.eventId)),

  /**
   * Admin: delete an invitation.
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .meta({ description: "Delete an invitation." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.invitations.delete(input.id);
      return { success: true };
    }),
});
