import { z } from "zod";
import { MemberPosition } from "../../lib/enums";

// ----- Bike sub-schema (for profile view) -----

const ProfileBikeSchema = z.object({
  id: z.string(),
  year: z.number(),
  make: z.string(),
  model: z.string(),
  trim: z.string().nullable(),
  mods: z.string().nullable(),
  has_photo: z.boolean(),
  is_primary: z.boolean(),
});

// ----- Input schemas -----

export const MemberProfileGetInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

const PhoneInputSchema = z.object({
  id: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  type: z.string().min(1),
  is_primary: z.boolean(),
});

const AddressInputSchema = z.object({
  id: z.string().optional(),
  address_line1: z.string().nullable().optional(),
  address_line2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string().min(1),
  type: z.string().min(1),
  is_primary_mailing: z.boolean(),
});

const EmergencyContactInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
});

export const ProfileSettingsUpdateInputSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  phones: z.array(PhoneInputSchema).optional(),
  addresses: z.array(AddressInputSchema).optional(),
  emergency_contacts: z.array(EmergencyContactInputSchema).optional(),
});

export const ProfilePhotoUploadInputSchema = z.object({
  photo: z.string().min(1, "Photo data is required"),
});

// ----- Output schemas -----

const PhoneOutputSchema = z.object({
  id: z.string(),
  phone: z.string(),
  type: z.string(),
  is_primary: z.boolean(),
});

const AddressOutputSchema = z.object({
  id: z.string(),
  address_line1: z.string().nullable(),
  address_line2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string(),
  type: z.string(),
  is_primary_mailing: z.boolean(),
});

const EmergencyContactOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  relationship: z.string().nullable(),
});

const ProfileEmergencyContactSchema = EmergencyContactOutputSchema.omit({
  id: true,
  email: true,
});

export const MemberProfileGetOutputSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  position: z.nativeEnum(MemberPosition).nullable(),
  member_since: z.string().nullable(),
  birthday: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z
    .object({
      line1: z.string().nullable(),
      line2: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      postal_code: z.string().nullable(),
    })
    .nullable(),
  emergency_contacts: z.array(ProfileEmergencyContactSchema),
  is_own_profile: z.boolean(),
  has_photo: z.boolean(),
  photo_url: z.string().nullable(),
  photo_thumbnail_url: z.string().nullable(),
  bikes: z.array(ProfileBikeSchema),
});

export const ProfileSettingsGetOutputSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  birthday: z.string().nullable(),
  has_photo: z.boolean(),
  photo_url: z.string().nullable(),
  phones: z.array(PhoneOutputSchema),
  addresses: z.array(AddressOutputSchema),
  emergency_contacts: z.array(EmergencyContactOutputSchema),
});

export const ProfileSettingsUpdateOutputSchema = z.object({
  success: z.boolean(),
});

export const ProfilePhotoUploadOutputSchema = z.object({
  success: z.boolean(),
});

// ----- Inferred types -----

export type MemberProfileGetInput = z.infer<typeof MemberProfileGetInputSchema>;
export type MemberProfileGetOutput = z.infer<typeof MemberProfileGetOutputSchema>;
export type ProfileSettingsGetOutput = z.infer<typeof ProfileSettingsGetOutputSchema>;
export type ProfileSettingsUpdateInput = z.infer<typeof ProfileSettingsUpdateInputSchema>;
export type ProfileSettingsUpdateOutput = z.infer<typeof ProfileSettingsUpdateOutputSchema>;
export type ProfilePhotoUploadInput = z.infer<typeof ProfilePhotoUploadInputSchema>;
export type ProfilePhotoUploadOutput = z.infer<typeof ProfilePhotoUploadOutputSchema>;
