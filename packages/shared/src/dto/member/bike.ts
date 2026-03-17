import { z } from "zod";

// ----- Input schemas -----

export const BikeCreateInputSchema = z.object({
  year: z.number().int().min(1900, "Year must be 1900 or later"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  trim: z.string().nullable().optional(),
  mods: z.string().max(500, "Mods must be 500 characters or fewer").nullable().optional(),
});

export const BikeUpdateInputSchema = z.object({
  id: z.string().min(1, "Bike ID is required"),
  year: z.number().int().min(1900, "Year must be 1900 or later").optional(),
  make: z.string().min(1, "Make is required").optional(),
  model: z.string().min(1, "Model is required").optional(),
  trim: z.string().nullable().optional(),
  mods: z.string().max(500, "Mods must be 500 characters or fewer").nullable().optional(),
});

export const BikeDeleteInputSchema = z.object({
  id: z.string().min(1, "Bike ID is required"),
});

export const BikeSetPrimaryInputSchema = z.object({
  id: z.string().min(1, "Bike ID is required"),
});

export const BikePhotoUploadInputSchema = z.object({
  id: z.string().min(1, "Bike ID is required"),
  photo: z.string().min(1, "Photo data is required"),
});

export const BikePhotoDeleteInputSchema = z.object({
  id: z.string().min(1, "Bike ID is required"),
});

// ----- Output schemas -----

export const BikeSchema = z.object({
  id: z.string(),
  year: z.number(),
  make: z.string(),
  model: z.string(),
  trim: z.string().nullable(),
  mods: z.string().nullable(),
  has_photo: z.boolean(),
  is_primary: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const BikeListOutputSchema = z.object({
  items: z.array(BikeSchema),
});

export const BikeCreateOutputSchema = BikeSchema;
export const BikeUpdateOutputSchema = BikeSchema;

export const BikeDeleteOutputSchema = z.object({
  success: z.boolean(),
});

export const BikeSetPrimaryOutputSchema = z.object({
  success: z.boolean(),
});

export const BikePhotoUploadOutputSchema = z.object({
  success: z.boolean(),
});

export const BikePhotoDeleteOutputSchema = z.object({
  success: z.boolean(),
});

// ----- Inferred types -----

export type Bike = z.infer<typeof BikeSchema>;
export type BikeCreateInput = z.infer<typeof BikeCreateInputSchema>;
export type BikeUpdateInput = z.infer<typeof BikeUpdateInputSchema>;
export type BikeDeleteInput = z.infer<typeof BikeDeleteInputSchema>;
export type BikeSetPrimaryInput = z.infer<typeof BikeSetPrimaryInputSchema>;
export type BikePhotoUploadInput = z.infer<typeof BikePhotoUploadInputSchema>;
export type BikePhotoDeleteInput = z.infer<typeof BikePhotoDeleteInputSchema>;
export type BikeListOutput = z.infer<typeof BikeListOutputSchema>;
export type BikeCreateOutput = z.infer<typeof BikeCreateOutputSchema>;
export type BikeUpdateOutput = z.infer<typeof BikeUpdateOutputSchema>;
export type BikeDeleteOutput = z.infer<typeof BikeDeleteOutputSchema>;
export type BikeSetPrimaryOutput = z.infer<typeof BikeSetPrimaryOutputSchema>;
export type BikePhotoUploadOutput = z.infer<typeof BikePhotoUploadOutputSchema>;
export type BikePhotoDeleteOutput = z.infer<typeof BikePhotoDeleteOutputSchema>;
