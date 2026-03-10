import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  ScenarioCreateInputSchema,
  ScenarioCreateOutputSchema,
  ScenarioDeleteInputSchema,
  ScenarioDeleteOutputSchema,
  ScenarioGetInputSchema,
  ScenarioGetOutputSchema,
  ScenarioListOutputSchema,
  ScenarioUpdateInputSchema,
  ScenarioUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/scenario";

export const scenariosRouter = t.router({
  list: t.procedure
    .output(ScenarioListOutputSchema)
    .meta({ description: "List all scenarios." })
    .query(async ({ ctx }) => ctx.api.scenarios.list()),

  get: t.procedure
    .input(ScenarioGetInputSchema)
    .output(ScenarioGetOutputSchema)
    .meta({ description: "Get a scenario by id." })
    .query(async ({ ctx, input }) => {
      const s = await ctx.api.scenarios.get(input.id);
      if (!s) throw new TRPCError({ code: "NOT_FOUND" });
      return s;
    }),

  create: t.procedure
    .input(ScenarioCreateInputSchema)
    .output(ScenarioCreateOutputSchema)
    .meta({ description: "Create a new scenario." })
    .mutation(async ({ ctx, input }) => ctx.api.scenarios.create(input)),

  update: t.procedure
    .input(ScenarioUpdateInputSchema)
    .output(ScenarioUpdateOutputSchema)
    .meta({ description: "Update a scenario." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const s = await ctx.api.scenarios.update(id, body);
      if (!s) throw new TRPCError({ code: "NOT_FOUND" });
      return s;
    }),

  delete: t.procedure
    .input(ScenarioDeleteInputSchema)
    .output(ScenarioDeleteOutputSchema)
    .meta({ description: "Delete a scenario." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.scenarios.delete(input.id);
      return { ok: true as const };
    }),
});
