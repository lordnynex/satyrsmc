import { memberProcedure, t } from "../../trpc";
import {
  RosterListInputSchema,
  RosterListOutputSchema,
  RosterFilterOptionsOutputSchema,
} from "@satyrsmc/shared/dto/member/roster";

export const memberRosterRouter = t.router({
  list: memberProcedure
    .input(RosterListInputSchema)
    .output(RosterListOutputSchema)
    .meta({ description: "List roster members with optional filters." })
    .query(async ({ ctx, input }) => ctx.api.roster.list(input)),

  getFilterOptions: memberProcedure
    .output(RosterFilterOptionsOutputSchema)
    .meta({ description: "Get distinct filter option values for the roster." })
    .query(async ({ ctx }) => ctx.api.roster.getFilterOptions()),
});
