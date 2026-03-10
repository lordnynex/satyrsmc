import { z } from "zod";

// ----- Input schemas -----

export const BudgetGetInputSchema = z.object({ id: z.string() });

export const BudgetCreateInputSchema = z.object({
  name: z.string(),
  year: z.number(),
  description: z.string().optional(),
});

export const BudgetUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  year: z.number().optional(),
  description: z.string().optional(),
});

export const BudgetDeleteInputSchema = z.object({ id: z.string() });

export const BudgetAddLineItemInputSchema = z.object({
  budgetId: z.string(),
  name: z.string(),
  category: z.string(),
  comments: z.string().optional(),
  unitCost: z.number(),
  quantity: z.number(),
  historicalCosts: z.record(z.number()).optional(),
});

export const BudgetUpdateLineItemInputSchema = z.object({
  budgetId: z.string(),
  itemId: z.string(),
  name: z.string().optional(),
  category: z.string().optional(),
  comments: z.string().optional(),
  unitCost: z.number().optional(),
  quantity: z.number().optional(),
  historicalCosts: z.record(z.number()).optional(),
});

export const BudgetDeleteLineItemInputSchema = z.object({
  budgetId: z.string(),
  itemId: z.string(),
});

// ----- Output entity schemas -----

const LineItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  comments: z.string().nullable().optional(),
  unitCost: z.number(),
  quantity: z.number(),
  historicalCosts: z.record(z.number()).optional().nullable(),
});

const BudgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  year: z.number(),
  description: z.string().nullable().optional(),
  created_at: z.string().optional(),
  lineItems: z.array(LineItemSchema).optional().default([]),
});

const BudgetSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  year: z.number(),
  description: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// ----- Procedure output schemas -----

export const BudgetListOutputSchema = z.array(BudgetSummarySchema);
export const BudgetGetOutputSchema = BudgetSchema;
export const BudgetCreateOutputSchema = BudgetSchema;
export const BudgetUpdateOutputSchema = BudgetSchema;
export const BudgetDeleteOutputSchema = z.object({ ok: z.literal(true) });
export const BudgetAddLineItemOutputSchema = LineItemSchema;
export const BudgetUpdateLineItemOutputSchema = LineItemSchema;
export const BudgetDeleteLineItemOutputSchema = z.object({ ok: z.literal(true) });

// ----- Inferred output types -----

export type BudgetListOutput = z.infer<typeof BudgetListOutputSchema>;
export type BudgetGetOutput = z.infer<typeof BudgetGetOutputSchema>;
export type BudgetCreateOutput = z.infer<typeof BudgetCreateOutputSchema>;
export type BudgetUpdateOutput = z.infer<typeof BudgetUpdateOutputSchema>;
export type BudgetDeleteOutput = z.infer<typeof BudgetDeleteOutputSchema>;
export type BudgetAddLineItemOutput = z.infer<typeof BudgetAddLineItemOutputSchema>;
export type BudgetUpdateLineItemOutput = z.infer<typeof BudgetUpdateLineItemOutputSchema>;
export type BudgetDeleteLineItemOutput = z.infer<typeof BudgetDeleteLineItemOutputSchema>;
