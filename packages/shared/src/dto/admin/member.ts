import { z } from "zod";

// ----- Input schemas -----

export const MemberGetInputSchema = z.object({ id: z.string() });

export const MemberCreateInputSchema = z.object({
  name: z.string(),
  phone_number: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
});

export const MemberUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  phone_number: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
});

export const MemberDeleteInputSchema = z.object({ id: z.string() });

export const MemberGetPhotoInputSchema = z.object({
  id: z.string(),
  size: z.enum(["thumbnail", "medium", "full"]).optional(),
});

// ----- Output entity schemas -----

const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone_number: z.string().nullable(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  member_since: z.string().nullable().optional(),
  is_baby: z.boolean().optional(),
  position: z.string().nullable(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
  photo_thumbnail_url: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// ----- Procedure output schemas -----

export const MemberListOutputSchema = z.array(MemberSchema);
export const MemberGetOutputSchema = MemberSchema;
export const MemberCreateOutputSchema = MemberSchema;
export const MemberUpdateOutputSchema = MemberSchema;
export const MemberDeleteOutputSchema = z.object({ ok: z.literal(true) });
export const MemberGetPhotoOutputSchema = z.string();

// ----- Inferred output types -----

export type MemberListOutput = z.infer<typeof MemberListOutputSchema>;
export type MemberGetOutput = z.infer<typeof MemberGetOutputSchema>;
export type MemberCreateOutput = z.infer<typeof MemberCreateOutputSchema>;
export type MemberUpdateOutput = z.infer<typeof MemberUpdateOutputSchema>;
export type MemberDeleteOutput = z.infer<typeof MemberDeleteOutputSchema>;
export type MemberGetPhotoOutput = z.infer<typeof MemberGetPhotoOutputSchema>;

// Alias for API
export type Member = MemberGetOutput;
