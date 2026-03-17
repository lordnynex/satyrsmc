import { z } from "zod";
import { UserType, UserStatus } from "../../lib/enums";
import { passwordSchema } from "../auth";

// ----- Input schemas -----

export const ChangePasswordInputSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const ChangeEmailInputSchema = z.object({
  new_email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required for verification"),
});

// ----- Output schemas -----

export const AccountSettingsGetOutputSchema = z.object({
  username: z.string(),
  user_type: z.nativeEnum(UserType),
  user_status: z.nativeEnum(UserStatus),
  email: z.string().nullable(),
  created_at: z.string().nullable(),
});

export const ChangePasswordOutputSchema = z.object({
  success: z.boolean(),
});

export const ChangeEmailOutputSchema = z.object({
  success: z.boolean(),
});

// ----- Inferred types -----

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;
export type ChangeEmailInput = z.infer<typeof ChangeEmailInputSchema>;
export type AccountSettingsGetOutput = z.infer<typeof AccountSettingsGetOutputSchema>;
export type ChangePasswordOutput = z.infer<typeof ChangePasswordOutputSchema>;
export type ChangeEmailOutput = z.infer<typeof ChangeEmailOutputSchema>;
