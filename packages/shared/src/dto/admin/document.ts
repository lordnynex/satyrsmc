import { z } from "zod";

// ----- Input schemas -----

export const DocumentGetInputSchema = z.object({ id: z.string() });

export const DocumentUpdateInputSchema = z.object({
  id: z.string(),
  content: z.string(),
});

export const DocumentGetVersionsInputSchema = z.object({ id: z.string() });

export const DocumentRestoreInputSchema = z.object({
  id: z.string(),
  versionId: z.string(),
});

export const DocumentExportPdfInputSchema = z.object({ id: z.string() });

// ----- Output entity schemas -----

const DocumentSchema = z.object({
  id: z.string(),
  content: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const DocumentVersionSchema = z.object({
  id: z.string(),
  document_id: z.string(),
  content: z.string(),
  version_number: z.number(),
  created_at: z.string().optional(),
});

// ----- Procedure output schemas -----

export const DocumentGetOutputSchema = DocumentSchema;
export const DocumentUpdateOutputSchema = DocumentSchema;
export const DocumentGetVersionsOutputSchema = z.array(DocumentVersionSchema);
export const DocumentRestoreOutputSchema = DocumentSchema;
export const DocumentExportPdfOutputSchema = z.object({ base64: z.string() });

// ----- Inferred output types -----

export type DocumentGetOutput = z.infer<typeof DocumentGetOutputSchema>;
export type DocumentUpdateOutput = z.infer<typeof DocumentUpdateOutputSchema>;
export type DocumentGetVersionsOutput = z.infer<typeof DocumentGetVersionsOutputSchema>;
export type DocumentRestoreOutput = z.infer<typeof DocumentRestoreOutputSchema>;
export type DocumentExportPdfOutput = z.infer<typeof DocumentExportPdfOutputSchema>;
