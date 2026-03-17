import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "../../trpc";
import {
  BikeCreateInputSchema,
  BikeCreateOutputSchema,
  BikeUpdateInputSchema,
  BikeUpdateOutputSchema,
  BikeDeleteInputSchema,
  BikeDeleteOutputSchema,
  BikeSetPrimaryInputSchema,
  BikeSetPrimaryOutputSchema,
  BikeListOutputSchema,
  BikePhotoUploadInputSchema,
  BikePhotoUploadOutputSchema,
  BikePhotoDeleteInputSchema,
  BikePhotoDeleteOutputSchema,
} from "@satyrsmc/shared/dto/member/bike";

export const memberBikesRouter = t.router({
  list: protectedProcedure
    .output(BikeListOutputSchema)
    .meta({ description: "List your bikes." })
    .query(async ({ ctx }) => ctx.api.bikes.listByUser(ctx.session.userId)),

  create: protectedProcedure
    .input(BikeCreateInputSchema)
    .output(BikeCreateOutputSchema)
    .meta({ description: "Add a new bike to your garage." })
    .mutation(async ({ ctx, input }) => ctx.api.bikes.create(ctx.session.userId, input)),

  update: protectedProcedure
    .input(BikeUpdateInputSchema)
    .output(BikeUpdateOutputSchema)
    .meta({ description: "Update a bike in your garage." })
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.api.bikes.update(ctx.session.userId, input);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bike not found" });
      }
      return result;
    }),

  delete: protectedProcedure
    .input(BikeDeleteInputSchema)
    .output(BikeDeleteOutputSchema)
    .meta({ description: "Remove a bike from your garage." })
    .mutation(async ({ ctx, input }) => ctx.api.bikes.delete(ctx.session.userId, input.id)),

  setPrimary: protectedProcedure
    .input(BikeSetPrimaryInputSchema)
    .output(BikeSetPrimaryOutputSchema)
    .meta({ description: "Set a bike as your primary bike." })
    .mutation(async ({ ctx, input }) => ctx.api.bikes.setPrimary(ctx.session.userId, input.id)),

  uploadPhoto: protectedProcedure
    .input(BikePhotoUploadInputSchema)
    .output(BikePhotoUploadOutputSchema)
    .meta({ description: "Upload a photo for a bike." })
    .mutation(async ({ ctx, input }) =>
      ctx.api.bikes.uploadPhoto(ctx.session.userId, input.id, input.photo),
    ),

  deletePhoto: protectedProcedure
    .input(BikePhotoDeleteInputSchema)
    .output(BikePhotoDeleteOutputSchema)
    .meta({ description: "Remove a bike's photo." })
    .mutation(async ({ ctx, input }) => ctx.api.bikes.deletePhoto(ctx.session.userId, input.id)),
});
