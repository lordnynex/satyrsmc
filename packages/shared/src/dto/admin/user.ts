import { z } from "zod";
import { UserType, UserStatus } from "../../lib/enums";

// ----- Input schemas -----

export const UserListInputSchema = z
  .object({
    status: z.nativeEnum(UserStatus).optional(),
    user_type: z.nativeEnum(UserType).optional(),
    q: z.string().optional(),
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
  })
  .optional();

export const UserGetInputSchema = z.object({ id: z.string() });

export const UserUpdateStatusInputSchema = z.object({
  id: z.string(),
  user_status: z.nativeEnum(UserStatus),
});

export const UserUpdateTypeInputSchema = z.object({
  id: z.string(),
  user_type: z.nativeEnum(UserType),
});

export const UserLinkMemberInputSchema = z.object({
  id: z.string(),
  member_id: z.string().nullable(),
});

export const UserLinkContactInputSchema = z.object({
  id: z.string(),
  contact_id: z.string(),
});

export const UserAddNoteInputSchema = z.object({
  id: z.string(),
  admin_note: z.string(),
});

export const UserCreateInvitationInputSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  contact_id: z.string().optional(),
  member_id: z.string().optional(),
});

// ----- Output entity schemas -----

const UserSchema = z.object({
  id: z.string(),
  contact_id: z.string(),
  member_id: z.string().nullable(),
  username: z.string(),
  user_type: z.nativeEnum(UserType),
  user_status: z.nativeEnum(UserStatus),
  last_login: z.string().nullable(),
  failed_login_attempts: z.number(),
  locked_until: z.string().nullable(),
  admin_note: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  // Joined from contact
  display_name: z.string().optional(),
  email: z.string().nullable().optional(),
});

const RegistrationSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  expires_at: z.string(),
  contact_id: z.string().nullable(),
  member_id: z.string().nullable(),
  invited_by: z.string().nullable(),
  created_at: z.string().nullable(),
});

const UserListResultSchema = z.object({
  users: z.array(UserSchema),
  total: z.number(),
});

const UserPendingCountSchema = z.object({
  locked_count: z.number(),
  registration_count: z.number(),
});

// ----- Procedure output schemas -----

export const UserPendingCountOutputSchema = UserPendingCountSchema;
export const UserListOutputSchema = UserListResultSchema;
export const UserGetOutputSchema = UserSchema;
export const UserUpdateStatusOutputSchema = UserSchema;
export const UserUpdateTypeOutputSchema = UserSchema;
export const UserLinkMemberOutputSchema = UserSchema;
export const UserLinkContactOutputSchema = UserSchema;
export const UserAddNoteOutputSchema = UserSchema;
export const UserCreateInvitationOutputSchema = RegistrationSchema;
export const RegistrationListOutputSchema = z.array(RegistrationSchema);

// ----- Inferred output types -----

export type UserListOutput = z.infer<typeof UserListOutputSchema>;
export type UserGetOutput = z.infer<typeof UserGetOutputSchema>;
export type UserUpdateStatusOutput = z.infer<typeof UserUpdateStatusOutputSchema>;
export type UserUpdateTypeOutput = z.infer<typeof UserUpdateTypeOutputSchema>;
export type UserLinkMemberOutput = z.infer<typeof UserLinkMemberOutputSchema>;
export type UserLinkContactOutput = z.infer<typeof UserLinkContactOutputSchema>;
export type UserAddNoteOutput = z.infer<typeof UserAddNoteOutputSchema>;
export type UserCreateInvitationOutput = z.infer<typeof UserCreateInvitationOutputSchema>;
export type RegistrationListOutput = z.infer<typeof RegistrationListOutputSchema>;
export type UserPendingCountOutput = z.infer<typeof UserPendingCountOutputSchema>;

// Aliases
export type User = UserGetOutput;
export type Registration = z.infer<typeof RegistrationSchema>;
