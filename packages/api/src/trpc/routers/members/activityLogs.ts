import { protectedProcedure, t } from "../../trpc";
import {
  MyActivityLogListInputSchema,
  MyActivityLogListOutputSchema,
} from "@satyrsmc/shared/dto/member/activityLog";

export const memberActivityLogsRouter = t.router({
  list: protectedProcedure
    .input(MyActivityLogListInputSchema)
    .output(MyActivityLogListOutputSchema)
    .meta({ description: "List your own activity log entries." })
    .query(async ({ ctx, input }) =>
      ctx.api.activityLogs.list({
        user_id: ctx.session.userId,
        page: input?.page ?? 1,
        per_page: input?.per_page ?? 20,
      }),
    ),
});
