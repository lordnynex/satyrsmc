import { t, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  RegisterInputSchema,
  ValidateTokenInputSchema,
  SignupInputSchema,
  LoginInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  AuthResultSchema,
  GenericMessageSchema,
  ValidateTokenResultSchema,
  AuthUserSchema,
} from "@satyrsmc/shared/dto/auth";

export const authRouter = t.router({
  register: t.procedure
    .input(RegisterInputSchema)
    .output(GenericMessageSchema)
    .meta({ description: "Register for an account. Sends a signup email." })
    .mutation(async ({ ctx, input }) => {
      return ctx.api.auth.register(input);
    }),

  validateToken: t.procedure
    .input(ValidateTokenInputSchema)
    .output(ValidateTokenResultSchema)
    .meta({ description: "Validate a registration token." })
    .query(async ({ ctx, input }) => {
      return ctx.api.auth.validateToken(input.token);
    }),

  signup: t.procedure
    .input(SignupInputSchema)
    .output(AuthResultSchema)
    .meta({ description: "Complete signup with a valid registration token." })
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.api.auth.signup(input);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Signup failed";
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
    }),

  login: t.procedure
    .input(LoginInputSchema)
    .meta({ description: "Log in with username and password." })
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.api.auth.login(input);

        // Set cookies
        const isProduction = process.env.NODE_ENV === "production";
        const sameSite = isProduction ? "Strict" : "Lax";
        const secure = isProduction ? "; Secure" : "";

        ctx.resHeaders.append(
          "Set-Cookie",
          `satyrs_access=${result.accessToken}; HttpOnly; Path=/trpc; SameSite=${sameSite}${secure}; Max-Age=900`,
        );
        ctx.resHeaders.append(
          "Set-Cookie",
          `satyrs_refresh=${result.refreshToken}; HttpOnly; Path=/trpc/auth.refresh; SameSite=${sameSite}${secure}; Max-Age=604800`,
        );

        return { user: result.user };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Login failed";
        throw new TRPCError({ code: "UNAUTHORIZED", message });
      }
    }),

  me: protectedProcedure
    .output(AuthUserSchema)
    .meta({ description: "Get the current authenticated user." })
    .query(async ({ ctx }) => {
      const user = await ctx.api.auth.me(ctx.session.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  refresh: t.procedure
    .meta({ description: "Refresh access token using refresh cookie." })
    .mutation(async ({ ctx }) => {
      const cookieHeader = ctx.req.headers.get("cookie");
      const refreshToken = cookieHeader
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("satyrs_refresh="))
        ?.split("=")
        .slice(1)
        .join("=");

      if (!refreshToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No refresh token" });
      }

      try {
        const result = await ctx.api.auth.refresh(refreshToken);

        const isProduction = process.env.NODE_ENV === "production";
        const sameSite = isProduction ? "Strict" : "Lax";
        const secure = isProduction ? "; Secure" : "";

        ctx.resHeaders.append(
          "Set-Cookie",
          `satyrs_access=${result.accessToken}; HttpOnly; Path=/trpc; SameSite=${sameSite}${secure}; Max-Age=900`,
        );
        ctx.resHeaders.append(
          "Set-Cookie",
          `satyrs_refresh=${result.refreshToken}; HttpOnly; Path=/trpc/auth.refresh; SameSite=${sameSite}${secure}; Max-Age=604800`,
        );

        return { user: result.user };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Refresh failed";
        throw new TRPCError({ code: "UNAUTHORIZED", message });
      }
    }),

  logout: t.procedure
    .output(GenericMessageSchema)
    .meta({ description: "Log out and clear auth cookies." })
    .mutation(async ({ ctx }) => {
      ctx.resHeaders.append("Set-Cookie", "satyrs_access=; HttpOnly; Path=/trpc; Max-Age=0");
      ctx.resHeaders.append(
        "Set-Cookie",
        "satyrs_refresh=; HttpOnly; Path=/trpc/auth.refresh; Max-Age=0",
      );
      return { message: "Logged out" };
    }),

  forgotPassword: t.procedure
    .input(ForgotPasswordInputSchema)
    .output(GenericMessageSchema)
    .meta({ description: "Request a password reset email." })
    .mutation(async ({ ctx, input }) => {
      return ctx.api.auth.forgotPassword(input.email);
    }),

  resetPassword: t.procedure
    .input(ResetPasswordInputSchema)
    .output(GenericMessageSchema)
    .meta({ description: "Reset password with a valid token." })
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.api.auth.resetPassword(input);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Reset failed";
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
    }),
});
