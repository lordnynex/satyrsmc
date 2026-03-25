import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "../../trpc";
import {
  MemberEventListInputSchema,
  MemberEventListOutputSchema,
  MemberEventGetInputSchema,
  MemberEventGetOutputSchema,
  MemberEventRsvpInputSchema,
  MemberEventRsvpOutputSchema,
} from "@satyrsmc/shared/dto/member/event";

export const memberEventsRouter = t.router({
  list: protectedProcedure
    .input(MemberEventListInputSchema)
    .output(MemberEventListOutputSchema)
    .meta({ description: "List events for authenticated users with RSVP info." })
    .query(async ({ ctx, input }) => ctx.api.memberEvents.list(ctx.session.contactId, input)),

  get: protectedProcedure
    .input(MemberEventGetInputSchema)
    .output(MemberEventGetOutputSchema)
    .meta({ description: "Get event detail for authenticated users." })
    .query(async ({ ctx, input }) => {
      const result = await ctx.api.memberEvents.get(ctx.session.contactId, input.id);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  rsvp: protectedProcedure
    .input(MemberEventRsvpInputSchema)
    .output(MemberEventRsvpOutputSchema)
    .meta({ description: "RSVP to an event." })
    .mutation(async ({ ctx, input }) => {
      // Fetch event to compute payment amount
      const event = await ctx.api.events.get(input.eventId);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

      const paymentAmountCents = event.ga_ticket_cost
        ? Math.round(event.ga_ticket_cost * 100)
        : null;

      // Legal audit trail: records the exact waiver version signed (by content hash),
      // the user's IP address, and browser at the time of submission. This provides
      // verifiable evidence of consent if the waiver is ever disputed.
      const waiverContentHash = input.waiver_signed
        ? ((await ctx.api.rsvps.getCurrentWaiver())?.contentHash ?? "")
        : undefined;
      const waiverIp = input.waiver_signed
        ? (ctx.req.headers.get("x-forwarded-for") ?? ctx.req.headers.get("x-real-ip") ?? "unknown")
        : undefined;
      const waiverUserAgent = input.waiver_signed ? ctx.req.headers.get("user-agent") : undefined;

      return ctx.api.memberEvents.rsvp({
        contactId: ctx.session.contactId,
        userId: ctx.session.userId,
        eventId: input.eventId,
        status: input.status,
        waiverSigned: input.waiver_signed,
        waiverContentHash,
        waiverIp,
        waiverUserAgent,
        paymentMethod: input.paymentMethod,
        paymentAmountCents,
        badgerDetails: input.badgerDetails,
      });
    }),
});
