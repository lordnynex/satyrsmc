import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { t, protectedProcedure } from "../trpc";
import { SubmitAuthBadgerRegistrationInputSchema } from "@satyrsmc/shared/dto/admin/rsvp";
import { RegistrationMethod } from "@satyrsmc/shared/lib/enums";

export const registrationRouter = t.router({
  /**
   * Authenticated: get form data with pre-filled contact info.
   */
  getFormDataAuth: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.api.events.get(input.eventId);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      const waiver = await ctx.api.rsvps.getCurrentWaiver();

      // Fetch user's contact info for pre-fill
      const contactId = ctx.session.contactId;
      const prefill = await ctx.api.rsvps.getContactPrefill(contactId);

      return {
        event: {
          id: event.id,
          name: event.name,
          startDate: event.start_date ?? null,
          gaTicketCost: event.ga_ticket_cost ?? null,
        },
        waiver,
        prefill,
      };
    }),

  /**
   * Authenticated: submit Badger registration as logged-in user.
   */
  submitAuthForm: protectedProcedure
    .input(SubmitAuthBadgerRegistrationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.api.events.get(input.eventId);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      const contactId = ctx.session.contactId;
      const userId = ctx.session.userId;

      // Check duplicate
      const hasActive = await ctx.api.rsvps.hasActiveRsvp(contactId, input.eventId);
      if (hasActive) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already registered for this event",
        });
      }

      const waiver = await ctx.api.rsvps.getCurrentWaiver();
      const waiverContentHash = waiver?.contentHash ?? "";

      const ip =
        ctx.req.headers.get("x-forwarded-for") ?? ctx.req.headers.get("x-real-ip") ?? "unknown";
      const userAgent = ctx.req.headers.get("user-agent") ?? null;

      const paymentAmountCents = event.ga_ticket_cost
        ? Math.round(event.ga_ticket_cost * 100)
        : null;

      const rsvp = await ctx.api.rsvps.submitBadgerRegistration({
        eventId: input.eventId,
        registrationMethod: RegistrationMethod.Auth,
        contactId,
        userId,
        paymentMethod: input.paymentMethod,
        paymentAmountCents,
        waiverContentHash,
        waiverIp: ip,
        waiverUserAgent: userAgent,
        badgerDetails: input.badgerDetails,
      });

      return { rsvpId: rsvp.id };
    }),
});
