import { t, adminProcedure } from "../../trpc";
import {
  MembershipLogListInputSchema,
  MembershipLogListOutputSchema,
  MembershipLogCreateInputSchema,
  MembershipLogCreateOutputSchema,
} from "@satyrsmc/shared/dto/admin/membershipLog";

export const membershipLogsRouter = t.router({
  list: adminProcedure
    .input(MembershipLogListInputSchema)
    .output(MembershipLogListOutputSchema)
    .meta({ description: "List membership log entries for a user." })
    .query(async ({ ctx, input }) => ctx.api.membershipLogs.list(input)),

  create: adminProcedure
    .input(MembershipLogCreateInputSchema)
    .output(MembershipLogCreateOutputSchema)
    .meta({ description: "Create a membership log entry." })
    .mutation(async ({ ctx, input }) => ctx.api.membershipLogs.create(input, ctx.session.userId)),
});
