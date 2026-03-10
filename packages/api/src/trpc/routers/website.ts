import { t } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  GetBlogBySlugInputSchema,
  GetBlogBySlugOutputSchema,
  GetBlogPublishedOutputSchema,
  GetEventsFeedOutputSchema,
  GetMembersFeedOutputSchema,
  GetMenusOutputSchema,
  GetPageByIdInputSchema,
  GetPageByIdOutputSchema,
  GetPagesOutputSchema,
  GetPageBySlugInputSchema,
  GetPageBySlugOutputSchema,
  GetSettingsOutputSchema,
  SubmitContactInputSchema,
  SubmitContactMemberInputSchema,
  SubmitContactMemberOutputSchema,
  SubmitContactOutputSchema,
} from "@satyrsmc/shared/dto/website";

export const websiteRouter = t.router({
  getEventsFeed: t.procedure
    .output(GetEventsFeedOutputSchema)
    .meta({ description: "List events shown on the public website feed." })
    .query(async ({ ctx }) => ctx.api.events.listForWebsite()),

  getMembersFeed: t.procedure
    .output(GetMembersFeedOutputSchema)
    .meta({ description: "List members shown on the public website feed." })
    .query(async ({ ctx }) => ctx.api.members.listForWebsite()),

  getBlogPublished: t.procedure
    .output(GetBlogPublishedOutputSchema)
    .meta({ description: "List published blog posts for the public site." })
    .query(async ({ ctx }) => ctx.api.blog.listPublished()),

  getBlogBySlug: t.procedure
    .input(GetBlogBySlugInputSchema)
    .output(GetBlogBySlugOutputSchema)
    .meta({ description: "Get a single blog post by slug." })
    .query(async ({ ctx, input }) => {
      const post = await ctx.api.blog.getBySlug(input.slug);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  getPages: t.procedure
    .output(GetPagesOutputSchema)
    .meta({ description: "List all site pages." })
    .query(async ({ ctx }) => ctx.api.sitePages.list()),

  getPageBySlug: t.procedure
    .input(GetPageBySlugInputSchema)
    .output(GetPageBySlugOutputSchema)
    .meta({ description: "Get a site page by slug." })
    .query(async ({ ctx, input }) => {
      const page = await ctx.api.sitePages.getBySlug(input.slug);
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });
      return page;
    }),

  getPageById: t.procedure
    .input(GetPageByIdInputSchema)
    .output(GetPageByIdOutputSchema)
    .meta({ description: "Get a site page by id." })
    .query(async ({ ctx, input }) => {
      const page = await ctx.api.sitePages.getById(input.id);
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });
      return page;
    }),

  submitContact: t.procedure
    .input(SubmitContactInputSchema)
    .output(SubmitContactOutputSchema)
    .meta({ description: "Submit a general contact form." })
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.api.contactSubmissions.createContact({
        name: input.name,
        email: input.email,
        subject: input.subject ?? null,
        message: input.message,
      });
      return { id: result.id, created: true as const };
    }),

  submitContactMember: t.procedure
    .input(SubmitContactMemberInputSchema)
    .output(SubmitContactMemberOutputSchema)
    .meta({ description: "Submit a contact form for a specific member." })
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.api.contactSubmissions.createContactMember(input);
      return { id: result.id, created: true as const };
    }),

  getMenus: t.procedure
    .output(GetMenusOutputSchema)
    .meta({ description: "Get all site menus keyed by menu key." })
    .query(async ({ ctx }) => ctx.api.siteMenus.listAll()),

  getSettings: t.procedure
    .output(GetSettingsOutputSchema)
    .meta({ description: "Get site settings." })
    .query(async ({ ctx }) => ctx.api.siteSettings.get()),
});

export type WebsiteRouter = typeof websiteRouter;
