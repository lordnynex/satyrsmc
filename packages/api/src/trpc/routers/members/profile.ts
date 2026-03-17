import { TRPCError } from "@trpc/server";
import { memberProcedure, protectedProcedure, t } from "../../trpc";
import {
  MemberProfileGetInputSchema,
  MemberProfileGetOutputSchema,
  ProfileSettingsGetOutputSchema,
  ProfileSettingsUpdateInputSchema,
  ProfileSettingsUpdateOutputSchema,
  ProfilePhotoUploadInputSchema,
  ProfilePhotoUploadOutputSchema,
} from "@satyrsmc/shared/dto/member/profile";

export const memberProfileRouter = t.router({
  get: memberProcedure
    .input(MemberProfileGetInputSchema)
    .output(MemberProfileGetOutputSchema)
    .meta({ description: "Get a member profile by username." })
    .query(async ({ ctx, input }) => {
      const profile = await ctx.api.profile.getByUsername(input.username, ctx.session.userId);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }
      return profile;
    }),

  getOwnSettings: protectedProcedure
    .output(ProfileSettingsGetOutputSchema)
    .meta({ description: "Get your own profile settings for editing." })
    .query(async ({ ctx }) => ctx.api.profile.getOwnSettings(ctx.session.userId)),

  updateOwnSettings: protectedProcedure
    .input(ProfileSettingsUpdateInputSchema)
    .output(ProfileSettingsUpdateOutputSchema)
    .meta({ description: "Update your own profile settings." })
    .mutation(async ({ ctx, input }) =>
      ctx.api.profile.updateOwnSettings(ctx.session.userId, input),
    ),

  uploadPhoto: protectedProcedure
    .input(ProfilePhotoUploadInputSchema)
    .output(ProfilePhotoUploadOutputSchema)
    .meta({ description: "Upload or replace your profile photo." })
    .mutation(async ({ ctx, input }) =>
      ctx.api.profile.uploadPhoto(ctx.session.userId, input.photo),
    ),
});
