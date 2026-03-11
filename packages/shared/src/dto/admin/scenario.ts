import { z } from "zod";

// ----- Input schemas -----

export const ScenarioGetInputSchema = z.object({ id: z.string() });

export const ScenarioCreateInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputs: z.record(z.unknown()).optional(),
});

export const ScenarioUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  inputs: z.record(z.unknown()).optional(),
});

export const ScenarioDeleteInputSchema = z.object({ id: z.string() });

// ----- Output entity schemas -----

const dateLike = z.union([z.string(), z.date().transform((d) => d.toISOString())]);

const ScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  inputs: z
    .union([z.record(z.unknown()), z.string()])
    .optional()
    .default({}),
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
