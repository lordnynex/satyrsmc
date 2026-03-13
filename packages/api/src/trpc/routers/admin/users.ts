import { t, adminProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  UserListInputSchema,
  UserGetInputSchema,
  UserUpdateStatusInputSchema,
  UserUpdateTypeInputSchema,
  UserLinkMemberInputSchema,
  UserLinkContactInputSchema,
  UserAddNoteInputSchema,
  UserCreateInvitationInputSchema,
  UserListOutputSchema,
  UserGetOutputSchema,
  UserUpdateStatusOutputSchema,
  UserUpdateTypeOutputSchema,
  UserLinkMemberOutputSchema,
  UserLinkContactOutputSchema,
  UserAddNoteOutputSchema,
  UserCreateInvitationOutputSchema,
  RegistrationListOutputSchema,
  UserPendingCountOutputSchema,
} from "@satyrsmc/shared/dto/admin/user";

export const usersRouter = t.router({
  list: adminProcedure
    .input(UserListInputSchema)
    .output(UserListOutputSchema)
    .meta({ description: "List all users." })
    .query(async ({ ctx, input }) => ctx.api.users.list(input ?? undefined)),

  get: adminProcedure
    .input(UserGetInputSchema)
    .output(UserGetOutputSchema)
    .meta({ description: "Get a user by id." })
    .query(async ({ ctx, input }) => {
      const user = await ctx.api.users.get(input.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  updateStatus: adminProcedure
    .input(UserUpdateStatusInputSchema)
    .output(UserUpdateStatusOutputSchema)
    .meta({ description: "Update a user's status." })
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.api.users.updateStatus(input.id, input.user_status);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  updateType: adminProcedure
    .input(UserUpdateTypeInputSchema)
    .output(UserUpdateTypeOutputSchema)
    .meta({ description: "Update a user's type/role." })
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.api.users.updateType(input.id, input.user_type);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  linkMember: adminProcedure
    .input(UserLinkMemberInputSchema)
    .output(UserLinkMemberOutputSchema)
    .meta({ description: "Link or unlink a user to a member record." })
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.api.users.linkMember(input.id, input.member_id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  linkContact: adminProcedure
    .input(UserLinkContactInputSchema)
    .output(UserLinkContactOutputSchema)
    .meta({ description: "Link a user to a contact record." })
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.api.users.linkContact(input.id, input.contact_id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  addNote: adminProcedure
    .input(UserAddNoteInputSchema)
    .output(UserAddNoteOutputSchema)
    .meta({ description: "Add an admin note to a user." })
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.api.users.addNote(input.id, input.admin_note);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  createInvitation: adminProcedure
    .input(UserCreateInvitationInputSchema)
    .output(UserCreateInvitationOutputSchema)
    .meta({ description: "Create an invitation for a new user." })
    .mutation(async ({ ctx, input }) => {
      return ctx.api.users.createInvitation(input, ctx.session.userId);
    }),

  pendingCount: adminProcedure
    .output(UserPendingCountOutputSchema)
    .meta({ description: "Count locked users and pending registrations." })
    .query(async ({ ctx }) => ctx.api.users.pendingCount()),

  listRegistrations: adminProcedure
    .output(RegistrationListOutputSchema)
    .meta({ description: "List pending registrations." })
    .query(async ({ ctx }) => ctx.api.users.listRegistrations()),
});
