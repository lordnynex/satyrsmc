import { z } from "zod";

// ----- Input schemas -----

export const WebsiteAdminGetPageByIdInputSchema = z.object({ id: z.string() });

export const WebsiteAdminCreatePageInputSchema = z.object({
  slug: z.string(),
  title: z.string(),
  body: z.string().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
});

export const WebsiteAdminUpdatePageInputSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
});

export const WebsiteAdminDeletePageInputSchema = z.object({ id: z.string() });

export const WebsiteAdminGetBlogByIdInputSchema = z.object({ id: z.string() });

export const WebsiteAdminCreateBlogPostInputSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable().optional(),
  body: z.string().optional(),
  published_at: z.string().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
});

export const WebsiteAdminUpdateBlogPostInputSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  title: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  body: z.string().optional(),
  published_at: z.string().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
});

export const WebsiteAdminDeleteBlogPostInputSchema = z.object({ id: z.string() });

export const WebsiteAdminUpdateMenuInputSchema = z.object({
  key: z.string(),
  items: z.array(
    z.object({
      label: z.string(),
      url: z.string().nullable().optional(),
      internal_ref: z.string().nullable().optional(),
      sort_order: z.number().optional(),
    }),
  ),
});

export const WebsiteAdminUpdateSettingsInputSchema = z.object({
  title: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  footer_text: z.string().nullable().optional(),
  default_meta_description: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
});

// ----- Output entity schemas -----

const SitePageResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  body: z.string(),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const BlogPostResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  body: z.string(),
  published_at: z.string().nullable(),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const SiteSettingsResponseSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  logo_url: z.string().nullable(),
  footer_text: z.string().nullable(),
  default_meta_description: z.string().nullable(),
  contact_email: z.string().nullable(),
  updated_at: z.string().optional(),
});

const MenuItemResponseSchema = z.object({
  id: z.string(),
  menu_key: z.string(),
  label: z.string(),
  url: z.string().nullable(),
  internal_ref: z.string().nullable(),
  sort_order: z.number().optional(),
});

// ----- Procedure output schemas -----

export const WebsiteAdminListPagesOutputSchema = z.array(SitePageResponseSchema);
export const WebsiteAdminGetPageByIdOutputSchema = SitePageResponseSchema;
export const WebsiteAdminCreatePageOutputSchema = SitePageResponseSchema;
export const WebsiteAdminUpdatePageOutputSchema = SitePageResponseSchema;
export const WebsiteAdminDeletePageOutputSchema = z.object({ ok: z.literal(true) });
export const WebsiteAdminListBlogAllOutputSchema = z.array(BlogPostResponseSchema);
export const WebsiteAdminGetBlogByIdOutputSchema = BlogPostResponseSchema;
export const WebsiteAdminCreateBlogPostOutputSchema = BlogPostResponseSchema;
export const WebsiteAdminUpdateBlogPostOutputSchema = BlogPostResponseSchema;
export const WebsiteAdminDeleteBlogPostOutputSchema = z.object({ ok: z.literal(true) });
export const WebsiteAdminGetMenusOutputSchema = z.record(
  z.string(),
  z.array(MenuItemResponseSchema),
);
export const WebsiteAdminUpdateMenuOutputSchema = z.array(MenuItemResponseSchema);
export const WebsiteAdminGetSettingsOutputSchema = SiteSettingsResponseSchema;
export const WebsiteAdminUpdateSettingsOutputSchema = SiteSettingsResponseSchema;
export const WebsiteAdminListContactSubmissionsOutputSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    subject: z.string().nullable(),
    message: z.string(),
    status: z.string(),
    created_at: z.string(),
  }),
);
export const WebsiteAdminListContactMemberSubmissionsOutputSchema = z.array(
  z.object({
    id: z.string(),
    member_id: z.string(),
    sender_name: z.string(),
    sender_email: z.string(),
    message: z.string(),
    status: z.string(),
    created_at: z.string(),
  }),
);

// ----- Inferred output types -----

export type WebsiteAdminListPagesOutput = z.infer<typeof WebsiteAdminListPagesOutputSchema>;
export type WebsiteAdminGetPageByIdOutput = z.infer<typeof WebsiteAdminGetPageByIdOutputSchema>;
export type WebsiteAdminCreatePageOutput = z.infer<typeof WebsiteAdminCreatePageOutputSchema>;
export type WebsiteAdminUpdatePageOutput = z.infer<typeof WebsiteAdminUpdatePageOutputSchema>;
export type WebsiteAdminDeletePageOutput = z.infer<typeof WebsiteAdminDeletePageOutputSchema>;
export type WebsiteAdminListBlogAllOutput = z.infer<typeof WebsiteAdminListBlogAllOutputSchema>;
export type WebsiteAdminGetBlogByIdOutput = z.infer<typeof WebsiteAdminGetBlogByIdOutputSchema>;
export type WebsiteAdminCreateBlogPostOutput = z.infer<
  typeof WebsiteAdminCreateBlogPostOutputSchema
>;
export type WebsiteAdminUpdateBlogPostOutput = z.infer<
  typeof WebsiteAdminUpdateBlogPostOutputSchema
>;
export type WebsiteAdminDeleteBlogPostOutput = z.infer<
  typeof WebsiteAdminDeleteBlogPostOutputSchema
>;
export type WebsiteAdminGetMenusOutput = z.infer<typeof WebsiteAdminGetMenusOutputSchema>;
export type WebsiteAdminUpdateMenuOutput = z.infer<typeof WebsiteAdminUpdateMenuOutputSchema>;
export type WebsiteAdminGetSettingsOutput = z.infer<typeof WebsiteAdminGetSettingsOutputSchema>;
export type WebsiteAdminUpdateSettingsOutput = z.infer<
  typeof WebsiteAdminUpdateSettingsOutputSchema
>;
export type WebsiteAdminListContactSubmissionsOutput = z.infer<
  typeof WebsiteAdminListContactSubmissionsOutputSchema
>;
export type WebsiteAdminListContactMemberSubmissionsOutput = z.infer<
  typeof WebsiteAdminListContactMemberSubmissionsOutputSchema
>;

// Aliases for API services
export type SitePageResponse = WebsiteAdminGetPageByIdOutput;
export type BlogPostResponse = WebsiteAdminGetBlogByIdOutput;
export type SiteSettingsResponse = WebsiteAdminGetSettingsOutput;
export type MenuItemResponse = z.infer<typeof WebsiteAdminUpdateMenuOutputSchema>[number];
export type MenusResponse = WebsiteAdminGetMenusOutput;
export type BlogPostCreateInput = z.infer<typeof WebsiteAdminCreateBlogPostInputSchema>;
export type BlogPostUpdateInput = z.infer<typeof WebsiteAdminUpdateBlogPostInputSchema>;
export type SitePageCreateInput = z.infer<typeof WebsiteAdminCreatePageInputSchema>;
export type SitePageUpdateInput = z.infer<typeof WebsiteAdminUpdatePageInputSchema>;
export type SiteSettingsUpdateInput = z.infer<typeof WebsiteAdminUpdateSettingsInputSchema>;
export type MenuItemUpdateInput = z.infer<
  typeof WebsiteAdminUpdateMenuInputSchema
>["items"][number];
