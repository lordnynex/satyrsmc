import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  MeetingTemplateCreateInputSchema,
  MeetingTemplateCreateOutputSchema,
  MeetingTemplateDeleteInputSchema,
  MeetingTemplateDeleteOutputSchema,
  MeetingTemplateGetInputSchema,
  MeetingTemplateGetOutputSchema,
  MeetingTemplateListInputSchema,
  MeetingTemplateListOutputSchema,
  MeetingTemplateUpdateInputSchema,
  MeetingTemplateUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/meeting";

export const meetingTemplatesRouter = t.router({
  list: t.procedure
    .input(MeetingTemplateListInputSchema)
    .output(MeetingTemplateListOutputSchema)
    .meta({ description: "List meeting templates, optionally by type." })
    .query(({ ctx, input }) => ctx.api.meetingTemplates.list(input?.type)),

  get: t.procedure
    .input(MeetingTemplateGetInputSchema)
    .output(MeetingTemplateGetOutputSchema)
    .meta({ description: "Get a meeting template by id." })
    .query(async ({ ctx, input }) => {
      const tpl = await ctx.api.meetingTemplates.get(input.id);
      if (!tpl) throw new TRPCError({ code: "NOT_FOUND" });
      return tpl;
    }),

  create: t.procedure
    .input(MeetingTemplateCreateInputSchema)
    .output(MeetingTemplateCreateOutputSchema)
    .meta({ description: "Create a new meeting template." })
    .mutation(({ ctx, input }) => ctx.api.meetingTemplates.create(input)),

  update: t.procedure
    .input(MeetingTemplateUpdateInputSchema)
    .output(MeetingTemplateUpdateOutputSchema)
    .meta({ description: "Update a meeting template." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const tpl = await ctx.api.meetingTemplates.update(id, body);
      if (!tpl) throw new TRPCError({ code: "NOT_FOUND" });
      return tpl;
    }),

  delete: t.procedure
    .input(MeetingTemplateDeleteInputSchema)
    .output(MeetingTemplateDeleteOutputSchema)
    .meta({ description: "Delete a meeting template." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.meetingTemplates.delete(input.id);
      return { ok: true as const };
    }),
});
