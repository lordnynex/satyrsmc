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

      // Legal audit trail: records the exact waiver version signed (by content hash),
      // the user's IP address, and browser at the time of submission. This provides
      // verifiable evidence of consent if the waiver is ever disputed.
      const waiver = await ctx.api.rsvps.getCurrentWaiver();
      const waiverContentHash = waiver?.contentHash ?? "";

      const rawIp =
        (ctx.req.headers["x-forwarded-for"] as string | undefined) ??
        (ctx.req.headers["x-real-ip"] as string | undefined) ??
        "unknown";
      const ip = rawIp.split(",")[0].trim();
      const userAgent = (ctx.req.headers["user-agent"] as string | undefined) ?? null;

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
