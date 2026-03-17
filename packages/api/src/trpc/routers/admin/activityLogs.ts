import { t, adminProcedure } from "../../trpc";
import {
  ActivityLogListInputSchema,
  ActivityLogListOutputSchema,
  ActivityLogCreateInputSchema,
  ActivityLogCreateOutputSchema,
} from "@satyrsmc/shared/dto/admin/activityLog";

export const activityLogsRouter = t.router({
  list: adminProcedure
    .input(ActivityLogListInputSchema)
    .output(ActivityLogListOutputSchema)
    .meta({ description: "List activity log entries." })
    .query(async ({ ctx, input }) => ctx.api.activityLogs.list(input ?? undefined)),

  create: adminProcedure
    .input(ActivityLogCreateInputSchema)
    .output(ActivityLogCreateOutputSchema)
    .meta({ description: "Create an activity log entry." })
    .mutation(async ({ ctx, input }) => ctx.api.activityLogs.create(input)),
});
