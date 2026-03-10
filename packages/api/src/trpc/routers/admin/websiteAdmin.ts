import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  WebsiteAdminCreateBlogPostInputSchema,
  WebsiteAdminCreateBlogPostOutputSchema,
  WebsiteAdminCreatePageInputSchema,
  WebsiteAdminCreatePageOutputSchema,
  WebsiteAdminDeleteBlogPostInputSchema,
  WebsiteAdminDeleteBlogPostOutputSchema,
  WebsiteAdminDeletePageInputSchema,
  WebsiteAdminDeletePageOutputSchema,
  WebsiteAdminGetBlogByIdInputSchema,
  WebsiteAdminGetBlogByIdOutputSchema,
  WebsiteAdminGetMenusOutputSchema,
  WebsiteAdminGetPageByIdInputSchema,
  WebsiteAdminGetPageByIdOutputSchema,
  WebsiteAdminGetSettingsOutputSchema,
  WebsiteAdminListBlogAllOutputSchema,
  WebsiteAdminListContactMemberSubmissionsOutputSchema,
  WebsiteAdminListContactSubmissionsOutputSchema,
  WebsiteAdminListPagesOutputSchema,
  WebsiteAdminUpdateBlogPostInputSchema,
  WebsiteAdminUpdateBlogPostOutputSchema,
  WebsiteAdminUpdateMenuInputSchema,
  WebsiteAdminUpdateMenuOutputSchema,
  WebsiteAdminUpdatePageInputSchema,
  WebsiteAdminUpdatePageOutputSchema,
  WebsiteAdminUpdateSettingsInputSchema,
  WebsiteAdminUpdateSettingsOutputSchema,
} from "@satyrsmc/shared/dto/admin/websiteAdmin";

export const websiteAdminRouter = t.router({
  listPages: t.procedure
    .output(WebsiteAdminListPagesOutputSchema)
    .meta({ description: "List all site pages." })
    .query(({ ctx }) => ctx.api.sitePages.list()),

  getPageById: t.procedure
    .input(WebsiteAdminGetPageByIdInputSchema)
    .output(WebsiteAdminGetPageByIdOutputSchema)
    .meta({ description: "Get a site page by id." })
    .query(async ({ ctx, input }) => {
      const p = await ctx.api.sitePages.getById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),

  createPage: t.procedure
    .input(WebsiteAdminCreatePageInputSchema)
    .output(WebsiteAdminCreatePageOutputSchema)
    .meta({ description: "Create a new site page." })
    .mutation(({ ctx, input }) => ctx.api.sitePages.create(input)),

  updatePage: t.procedure
    .input(WebsiteAdminUpdatePageInputSchema)
    .output(WebsiteAdminUpdatePageOutputSchema)
    .meta({ description: "Update a site page." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const p = await ctx.api.sitePages.update(id, body);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),

  deletePage: t.procedure
    .input(WebsiteAdminDeletePageInputSchema)
    .output(WebsiteAdminDeletePageOutputSchema)
    .meta({ description: "Delete a site page." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.sitePages.delete(input.id);
      return { ok: true as const };
    }),

  listBlogAll: t.procedure
    .output(WebsiteAdminListBlogAllOutputSchema)
    .meta({ description: "List all blog posts." })
    .query(({ ctx }) => ctx.api.blog.listAll()),

  getBlogById: t.procedure
    .input(WebsiteAdminGetBlogByIdInputSchema)
    .output(WebsiteAdminGetBlogByIdOutputSchema)
    .meta({ description: "Get a blog post by id." })
    .query(async ({ ctx, input }) => {
      const p = await ctx.api.blog.getById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),

  createBlogPost: t.procedure
    .input(WebsiteAdminCreateBlogPostInputSchema)
    .output(WebsiteAdminCreateBlogPostOutputSchema)
    .meta({ description: "Create a new blog post." })
    .mutation(({ ctx, input }) => ctx.api.blog.create(input)),

  updateBlogPost: t.procedure
    .input(WebsiteAdminUpdateBlogPostInputSchema)
    .output(WebsiteAdminUpdateBlogPostOutputSchema)
    .meta({ description: "Update a blog post." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const p = await ctx.api.blog.update(id, body);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),

  deleteBlogPost: t.procedure
    .input(WebsiteAdminDeleteBlogPostInputSchema)
    .output(WebsiteAdminDeleteBlogPostOutputSchema)
    .meta({ description: "Delete a blog post." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.blog.delete(input.id);
      return { ok: true as const };
    }),

  getMenus: t.procedure
    .output(WebsiteAdminGetMenusOutputSchema)
    .meta({ description: "Get all site menus." })
    .query(({ ctx }) => ctx.api.siteMenus.listAll()),

  updateMenu: t.procedure
    .input(WebsiteAdminUpdateMenuInputSchema)
    .output(WebsiteAdminUpdateMenuOutputSchema)
    .meta({ description: "Update a menu by key." })
    .mutation(({ ctx, input }) => ctx.api.siteMenus.updateMenu(input.key, input.items)),

  getSettings: t.procedure
    .output(WebsiteAdminGetSettingsOutputSchema)
    .meta({ description: "Get site settings." })
    .query(({ ctx }) => ctx.api.siteSettings.get()),

  updateSettings: t.procedure
    .input(WebsiteAdminUpdateSettingsInputSchema)
    .output(WebsiteAdminUpdateSettingsOutputSchema)
    .meta({ description: "Update site settings." })
    .mutation(({ ctx, input }) => ctx.api.siteSettings.update(input)),

  listContactSubmissions: t.procedure
    .output(WebsiteAdminListContactSubmissionsOutputSchema)
    .meta({ description: "List general contact form submissions." })
    .query(({ ctx }) => ctx.api.contactSubmissions.listContactSubmissions()),

  listContactMemberSubmissions: t.procedure
    .output(WebsiteAdminListContactMemberSubmissionsOutputSchema)
    .meta({ description: "List member contact form submissions." })
    .query(({ ctx }) => ctx.api.contactSubmissions.listContactMemberSubmissions()),
});
