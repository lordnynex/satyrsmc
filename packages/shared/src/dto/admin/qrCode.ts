import { z } from "zod";
import { QR_ERROR_CORRECTION_LEVELS, QR_FORMATS } from "../../lib/enums";

// ----- Input schemas -----

export const QrCodeGetInputSchema = z.object({ id: z.string() });

export const QrCodeCreateInputSchema = z.object({
  name: z.string().nullable().optional(),
  url: z.string(),
  config: z.record(z.unknown()).nullable().optional(),
});

export const QrCodeUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  url: z.string().optional(),
  config: z.record(z.unknown()).nullable().optional(),
});

export const QrCodeDeleteInputSchema = z.object({ id: z.string() });

export const QrCodeGetImageInputSchema = z.object({
  id: z.string(),
  size: z.number().optional(),
});

// ----- Output entity schemas -----

const QrCodeConfigSchema = z
  .object({
    errorCorrectionLevel: z.enum(QR_ERROR_CORRECTION_LEVELS).optional(),
    width: z.number().optional(),
    margin: z.number().optional(),
    color: z.object({ dark: z.string().optional(), light: z.string().optional() }).optional(),
    format: z.enum(QR_FORMATS).optional(),
  })
  .nullable();

const QrCodeSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  url: z.string(),
  config: QrCodeConfigSchema,
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ----- Procedure output schemas -----

export const QrCodeListOutputSchema = z.array(QrCodeSchema);
export const QrCodeGetOutputSchema = QrCodeSchema;
export const QrCodeCreateOutputSchema = QrCodeSchema;
export const QrCodeUpdateOutputSchema = QrCodeSchema;
export const QrCodeDeleteOutputSchema = z.object({ ok: z.literal(true) });
export const QrCodeGetImageOutputSchema = z.object({
  base64: z.string(),
  contentType: z.string(),
});

// ----- Inferred output types -----

export type QrCodeListOutput = z.infer<typeof QrCodeListOutputSchema>;
export type QrCodeGetOutput = z.infer<typeof QrCodeGetOutputSchema>;
export type QrCodeCreateOutput = z.infer<typeof QrCodeCreateOutputSchema>;
export type QrCodeUpdateOutput = z.infer<typeof QrCodeUpdateOutputSchema>;
export type QrCodeDeleteOutput = z.infer<typeof QrCodeDeleteOutputSchema>;
export type QrCodeGetImageOutput = z.infer<typeof QrCodeGetImageOutputSchema>;

// Aliases for API services
export type QrCode = QrCodeGetOutput;
export type QrCodeConfig = z.infer<typeof QrCodeConfigSchema>;
