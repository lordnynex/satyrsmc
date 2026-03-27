import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { t, protectedProcedure } from "../../trpc";
import { CancelRsvpInputSchema } from "@satyrsmc/shared/dto/admin/rsvp";

export const memberRsvpRouter = t.router({
  /** Get all RSVPs for the current user. */
  getMyRsvps: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.rsvps.findByContact(ctx.session.contactId);
  }),

  /** Get the current user's RSVP for a specific event. */
  getForEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.rsvps.findByContactAndEvent(ctx.session.contactId, input.eventId);
    }),

  /** Cancel the current user's RSVP. */
  cancel: protectedProcedure.input(CancelRsvpInputSchema).mutation(async ({ ctx, input }) => {
    // Verify the RSVP belongs to the current user
    const rsvp = await ctx.api.rsvps.findById(input.rsvpId);
    if (!rsvp) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Registration not found" });
    }
    if (rsvp.contactId !== ctx.session.contactId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only cancel your own registration",
      });
    }

    await ctx.api.rsvps.cancel(input.rsvpId, ctx.session.userId);
    return { ok: true as const };
  }),
});
