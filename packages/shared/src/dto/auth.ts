import { z } from "zod";
import { UserType, UserStatus } from "../lib/enums";

// ----- Validation schemas -----

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z]/, "Username must start with a letter")
  .regex(/^[a-zA-Z0-9.-]+$/, "Username may only contain letters, numbers, dots, and hyphens")
  .refine((val) => !/[.-]{2}/.test(val), "Username must not contain consecutive dots or hyphens");

// ----- Input schemas -----

export const RegisterInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  recaptcha_token: z.string().min(1, "reCAPTCHA is required"),
});

export const ValidateTokenInputSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const SignupInputSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    username: usernameSchema,
    password: passwordSchema,
    password_confirm: z.string(),
    birthday: z.string().refine(
      (val) => {
        const birth = new Date(val);
        const now = new Date();
        const age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        const dayDiff = now.getDate() - birth.getDate();
        const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        return adjustedAge >= 18;
      },
      { message: "You must be at least 18 years old" },
    ),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

export const InvitationSignupInputSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    username: usernameSchema,
    password: passwordSchema,
    password_confirm: z.string(),
    birthday: z.string().refine(
      (val) => {
        const birth = new Date(val);
        const now = new Date();
        const age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        const dayDiff = now.getDate() - birth.getDate();
        const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        return adjustedAge >= 18;
      },
      { message: "You must be at least 18 years old" },
    ),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

export const LoginInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  recaptcha_token: z.string().min(1, "reCAPTCHA is required"),
});

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordInputSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

// ----- Output schemas -----

export const AuthUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  user_type: z.nativeEnum(UserType),
  user_status: z.nativeEnum(UserStatus),
  contact_id: z.string(),
  member_id: z.string().nullable(),
  is_member: z.boolean(),
  last_login: z.string().nullable(),
});

export const AuthResultSchema = z.object({
  user: AuthUserSchema,
});

export const GenericMessageSchema = z.object({
  message: z.string(),
});

export const ValidateTokenResultSchema = z.object({
  valid: z.boolean(),
  email: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

// ----- Inferred types -----

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type ValidateTokenInput = z.infer<typeof ValidateTokenInputSchema>;
export type SignupInput = z.infer<typeof SignupInputSchema>;
export type InvitationSignupInput = z.infer<typeof InvitationSignupInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthResult = z.infer<typeof AuthResultSchema>;
export type GenericMessage = z.infer<typeof GenericMessageSchema>;
export type ValidateTokenResult = z.infer<typeof ValidateTokenResultSchema>;
