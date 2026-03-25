import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { t, adminProcedure } from "../../trpc";
import {
  ConfirmPaymentInputSchema,
  ConfirmBulkPaymentInputSchema,
  AdminCancelRsvpInputSchema,
  ProcessRefundInputSchema,
} from "@satyrsmc/shared/dto/admin/rsvp";

export const adminRsvpRouter = t.router({
  listPendingReview: adminProcedure
    .input(z.object({ eventId: z.string() }))
    .meta({ description: "List pending registrations for admin review." })
    .query(async ({ ctx, input }) => ctx.api.rsvps.findPendingReview(input.eventId)),

  listByEvent: adminProcedure
    .input(z.object({ eventId: z.string() }))
    .meta({ description: "List all RSVPs for an event (admin view)." })
    .query(async ({ ctx, input }) => ctx.api.rsvps.findByEventAdmin(input.eventId)),

  listActionRequired: adminProcedure
    .input(z.object({ eventId: z.string() }))
    .meta({
      description:
        "List registrations needing admin attention (pending contact, payment, or refund).",
    })
    .query(async ({ ctx, input }) => ctx.api.rsvps.findActionRequired(input.eventId)),

  get: adminProcedure
    .input(z.object({ rsvpId: z.string() }))
    .meta({ description: "Get a single RSVP by ID." })
    .query(async ({ ctx, input }) => {
      const rsvp = await ctx.api.rsvps.findById(input.rsvpId);
      if (!rsvp) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return rsvp;
    }),

  getLogs: adminProcedure
    .input(z.object({ rsvpId: z.string() }))
    .meta({ description: "Get audit logs for an RSVP." })
    .query(async ({ ctx, input }) => ctx.api.rsvpLogs.listByRsvp(input.rsvpId)),

  confirmPayment: adminProcedure
    .input(ConfirmPaymentInputSchema)
    .meta({ description: "Confirm payment receipt for a registration." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.rsvps.confirmPayment(input.rsvpId, ctx.session.userId, input.note);
      return { ok: true as const };
    }),

  confirmBulkPayment: adminProcedure
    .input(ConfirmBulkPaymentInputSchema)
    .meta({ description: "Confirm payment for multiple registrations." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.rsvps.confirmBulkPayment(input.rsvpIds, ctx.session.userId, input.note);
      return { ok: true as const };
    }),

  adminCancel: adminProcedure
    .input(AdminCancelRsvpInputSchema)
    .meta({ description: "Cancel a registration on behalf of a user." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.rsvps.adminCancel(input.rsvpId, ctx.session.userId);
      return { ok: true as const };
    }),

  processRefund: adminProcedure
    .input(ProcessRefundInputSchema)
    .meta({ description: "Process a refund for a cancelled registration." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.rsvps.processRefund(input.rsvpId, ctx.session.userId, input.note);
      return { ok: true as const };
    }),
});
