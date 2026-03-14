import { protectedProcedure, t } from "../../trpc";
import {
  MemberEventListInputSchema,
  MemberEventListOutputSchema,
  MemberEventRsvpInputSchema,
  MemberEventRsvpOutputSchema,
} from "@satyrsmc/shared/dto/member/event";

export const memberEventsRouter = t.router({
  list: protectedProcedure
    .input(MemberEventListInputSchema)
    .output(MemberEventListOutputSchema)
    .meta({ description: "List events for authenticated users with RSVP info." })
    .query(async ({ ctx, input }) => ctx.api.memberEvents.list(ctx.session.contactId, input)),

  rsvp: protectedProcedure
    .input(MemberEventRsvpInputSchema)
    .output(MemberEventRsvpOutputSchema)
    .meta({ description: "RSVP to an event." })
    .mutation(async ({ ctx, input }) =>
      ctx.api.memberEvents.rsvp(ctx.session.contactId, input.eventId, input.status),
    ),
});
