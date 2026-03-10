import { t } from "../../trpc";
import {
  IncidentListInputSchema,
  IncidentListOutputSchema,
} from "@satyrsmc/shared/dto/admin/incident";

export const incidentsRouter = t.router({
  list: t.procedure
    .input(IncidentListInputSchema)
    .output(IncidentListOutputSchema)
    .meta({ description: "List incidents with pagination." })
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const perPage = input?.per_page ?? 20;
      return ctx.api.events.listIncidents(page, perPage);
    }),
});
