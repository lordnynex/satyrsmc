import { protectedProcedure, t } from "../../trpc";
import {
  NotificationPreferencesOutputSchema,
  ToggleMailingListInputSchema,
  ToggleMailingListOutputSchema,
} from "@satyrsmc/shared/dto/member/notifications";

export const memberNotificationsRouter = t.router({
  getPreferences: protectedProcedure
    .output(NotificationPreferencesOutputSchema)
    .meta({ description: "Get your mailing list subscriptions." })
    .query(async ({ ctx }) => {
      const subs = await ctx.api.mailingLists.getSubscriptionsForContact(ctx.session.contactId);
      return { mailing_lists: subs };
    }),

  toggleMailingList: protectedProcedure
    .input(ToggleMailingListInputSchema)
    .output(ToggleMailingListOutputSchema)
    .meta({ description: "Subscribe or unsubscribe from a mailing list." })
    .mutation(async ({ ctx, input }) =>
      ctx.api.mailingLists.setUnsubscribed(
        ctx.session.contactId,
        input.list_id,
        input.unsubscribed,
      ),
    ),
});
