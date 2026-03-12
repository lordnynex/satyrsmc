import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { MemberPhotoSize } from "@satyrsmc/shared/lib/enums";
import {
  MemberCreateInputSchema,
  MemberCreateOutputSchema,
  MemberDeleteInputSchema,
  MemberDeleteOutputSchema,
  MemberGetInputSchema,
  MemberGetOutputSchema,
  MemberGetPhotoInputSchema,
  MemberGetPhotoOutputSchema,
  MemberListOutputSchema,
  MemberUpdateInputSchema,
  MemberUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/member";

export const membersRouter = t.router({
  list: t.procedure
    .output(MemberListOutputSchema)
    .meta({ description: "List all members." })
    .query(async ({ ctx }) => ctx.api.members.list()),

  get: t.procedure
    .input(MemberGetInputSchema)
    .output(MemberGetOutputSchema)
    .meta({ description: "Get a member by id." })
    .query(async ({ ctx, input }) => {
      const m = await ctx.api.members.get(input.id);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  create: t.procedure
    .input(MemberCreateInputSchema)
    .output(MemberCreateOutputSchema)
    .meta({ description: "Create a new member." })
    .mutation(async ({ ctx, input }) => {
      type CreateBody = Parameters<typeof ctx.api.members.create>[0];
      const out = await ctx.api.members.create(input as CreateBody);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  update: t.procedure
    .input(MemberUpdateInputSchema)
    .output(MemberUpdateOutputSchema)
    .meta({ description: "Update a member." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const m = await ctx.api.members.update(id, body);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  delete: t.procedure
    .input(MemberDeleteInputSchema)
    .output(MemberDeleteOutputSchema)
    .meta({ description: "Delete a member." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.members.delete(input.id);
      return { ok: true as const };
    }),

  getPhoto: t.procedure
    .input(MemberGetPhotoInputSchema)
    .output(MemberGetPhotoOutputSchema)
    .meta({ description: "Get a member photo as base64." })
    .query(async ({ ctx, input }) => {
      const buffer = await ctx.api.members.getPhoto(input.id, input.size ?? MemberPhotoSize.Full);
      if (!buffer) throw new TRPCError({ code: "NOT_FOUND" });
      return Buffer.from(buffer).toString("base64");
    }),
});
