import { z } from "zod";

// ----- Scenario inputs (budget/projection variables) -----

const TicketPricesSchema = z.object({
  proposedPrice1: z.number(),
  proposedPrice2: z.number(),
  proposedPrice3: z.number(),
  staffPrice1: z.number(),
  staffPrice2: z.number(),
  staffPrice3: z.number(),
});

export const ScenarioInputsSchema = z.object({
  profitTarget: z.number(),
  staffCount: z.number(),
  maxOccupancy: z.number(),
  complimentaryTickets: z.number(),
  dayPassPrice: z.number(),
  dayPassesSold: z.number(),
  ticketPrices: TicketPricesSchema,
});

export type ScenarioInputs = z.infer<typeof ScenarioInputsSchema>;

// ----- Input schemas -----

export const ScenarioGetInputSchema = z.object({ id: z.string() });

export const ScenarioCreateInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputs: ScenarioInputsSchema.optional(),
});

export const ScenarioUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  inputs: ScenarioInputsSchema.optional(),
});

export const ScenarioDeleteInputSchema = z.object({ id: z.string() });

// ----- Output entity schemas -----

const dateLike = z.union([z.string(), z.date().transform((d) => d.toISOString())]);

const ScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  inputs: ScenarioInputsSchema.optional().default({
    profitTarget: 0,
    staffCount: 0,
    maxOccupancy: 0,
    complimentaryTickets: 0,
    dayPassPrice: 0,
    dayPassesSold: 0,
    ticketPrices: {
      proposedPrice1: 0,
      proposedPrice2: 0,
      proposedPrice3: 0,
      staffPrice1: 0,
      staffPrice2: 0,
      staffPrice3: 0,
    },
  }),
  created_at: dateLike.optional(),
});

// ----- Procedure output schemas -----

export const ScenarioListOutputSchema = z.array(ScenarioSchema);
export const ScenarioGetOutputSchema = ScenarioSchema;
export const ScenarioCreateOutputSchema = ScenarioSchema;
export const ScenarioUpdateOutputSchema = ScenarioSchema;
export const ScenarioDeleteOutputSchema = z.object({ ok: z.literal(true) });

// ----- Inferred output types -----

export type ScenarioListOutput = z.infer<typeof ScenarioListOutputSchema>;
export type ScenarioGetOutput = z.infer<typeof ScenarioGetOutputSchema>;
export type ScenarioCreateOutput = z.infer<typeof ScenarioCreateOutputSchema>;
export type ScenarioUpdateOutput = z.infer<typeof ScenarioUpdateOutputSchema>;
export type ScenarioDeleteOutput = z.infer<typeof ScenarioDeleteOutputSchema>;
