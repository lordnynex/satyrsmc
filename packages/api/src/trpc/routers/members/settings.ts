import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "../../trpc";
import {
  AccountSettingsGetOutputSchema,
  ChangePasswordInputSchema,
  ChangePasswordOutputSchema,
  ChangeEmailInputSchema,
  ChangeEmailOutputSchema,
} from "@satyrsmc/shared/dto/member/settings";

export const memberSettingsRouter = t.router({
  getAccount: protectedProcedure
    .output(AccountSettingsGetOutputSchema)
    .meta({ description: "Get your account settings." })
    .query(async ({ ctx }) => ctx.api.settings.getAccount(ctx.session.userId)),

  changePassword: protectedProcedure
    .input(ChangePasswordInputSchema)
    .output(ChangePasswordOutputSchema)
    .meta({ description: "Change your password." })
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.api.settings.changePassword(
          ctx.session.userId,
          input.current_password,
          input.new_password,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to change password";
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
    }),

  changeEmail: protectedProcedure
    .input(ChangeEmailInputSchema)
    .output(ChangeEmailOutputSchema)
    .meta({ description: "Change your email address." })
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.api.settings.changeEmail(
          ctx.session.userId,
          input.new_email,
          input.password,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to change email";
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
    }),
});
