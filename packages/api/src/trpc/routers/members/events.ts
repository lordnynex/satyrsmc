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
    .mutation(async ({ ctx, input }) =>
      ctx.api.memberEvents.rsvp(
        ctx.session.contactId,
        input.eventId,
        input.status,
        input.waiver_signed,
      ),
    ),
});
