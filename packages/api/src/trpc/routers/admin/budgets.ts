import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  BudgetAddLineItemInputSchema,
  BudgetAddLineItemOutputSchema,
  BudgetCreateInputSchema,
  BudgetCreateOutputSchema,
  BudgetDeleteInputSchema,
  BudgetDeleteLineItemInputSchema,
  BudgetDeleteLineItemOutputSchema,
  BudgetDeleteOutputSchema,
  BudgetGetInputSchema,
  BudgetGetOutputSchema,
  BudgetListOutputSchema,
  BudgetUpdateInputSchema,
  BudgetUpdateLineItemInputSchema,
  BudgetUpdateLineItemOutputSchema,
  BudgetUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/budget";

export const budgetsRouter = t.router({
  list: t.procedure
    .output(BudgetListOutputSchema)
    .meta({ description: "List all budgets." })
    .query(async ({ ctx }) => ctx.api.budgets.list()),

  get: t.procedure
    .input(BudgetGetInputSchema)
    .output(BudgetGetOutputSchema)
    .meta({ description: "Get a budget by id." })
    .query(async ({ ctx, input }) => {
      const b = await ctx.api.budgets.get(input.id);
      if (!b) throw new TRPCError({ code: "NOT_FOUND" });
      return b;
    }),

  create: t.procedure
    .input(BudgetCreateInputSchema)
    .output(BudgetCreateOutputSchema)
    .meta({ description: "Create a new budget." })
    .mutation(async ({ ctx, input }) => {
      const b = await ctx.api.budgets.create(input);
      if (!b) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Budget create returned null" });
      return b;
    }),

  update: t.procedure
    .input(BudgetUpdateInputSchema)
    .output(BudgetUpdateOutputSchema)
    .meta({ description: "Update a budget." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const b = await ctx.api.budgets.update(id, body);
      if (!b) throw new TRPCError({ code: "NOT_FOUND" });
      return b;
    }),

  delete: t.procedure
    .input(BudgetDeleteInputSchema)
    .output(BudgetDeleteOutputSchema)
    .meta({ description: "Delete a budget." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.budgets.delete(input.id);
      return { ok: true as const };
    }),

  addLineItem: t.procedure
    .input(BudgetAddLineItemInputSchema)
    .output(BudgetAddLineItemOutputSchema)
    .meta({ description: "Add a line item to a budget." })
    .mutation(async ({ ctx, input }) => {
      const { budgetId, ...body } = input;
      return ctx.api.budgets.addLineItem(budgetId, body);
    }),

  updateLineItem: t.procedure
    .input(BudgetUpdateLineItemInputSchema)
    .output(BudgetUpdateLineItemOutputSchema)
    .meta({ description: "Update a budget line item." })
    .mutation(async ({ ctx, input }) => {
      const { budgetId, itemId, ...body } = input;
      const b = await ctx.api.budgets.updateLineItem(budgetId, itemId, body);
      if (!b) throw new TRPCError({ code: "NOT_FOUND" });
      return b;
    }),

  deleteLineItem: t.procedure
    .input(BudgetDeleteLineItemInputSchema)
    .output(BudgetDeleteLineItemOutputSchema)
    .meta({ description: "Delete a budget line item." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.budgets.deleteLineItem(input.budgetId, input.itemId);
      return { ok: true as const };
    }),
});
