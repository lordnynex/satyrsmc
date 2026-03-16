import { z } from "zod";

// ----- Input schemas -----

export const GetBlogBySlugInputSchema = z.object({
  slug: z.string(),
});

export const GetPageBySlugInputSchema = z.object({
  slug: z.string(),
});

export const GetPageByIdInputSchema = z.object({
  id: z.string(),
});

export const SubmitContactInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().nullable().optional(),
  message: z.string().min(1, "Message is required"),
  recaptcha_token: z.string().min(1, "Please complete the reCAPTCHA"),
});

export const SubmitContactMemberInputSchema = z.object({
  member_id: z.string(),
  sender_name: z.string().min(1, "Name is required"),
  sender_email: z.string().email("Please enter a valid email address"),
  message: z.string().min(1, "Message is required"),
  recaptcha_token: z.string().min(1, "Please complete the reCAPTCHA"),
});

// ----- Output schemas (entity shapes used by outputs) -----

const EventFeedItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  year: z.number().nullable(),
  start_date: z.string().nullable(),
  event_url: z.string().nullable(),
  event_location: z.string().nullable(),
  event_type: z.string(),
  created_at: z.string(),
});

const MemberFeedItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string().nullable(),
  photo_url: z.string().nullable(),
  photo_thumbnail_url: z.string().nullable(),
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

const SiteSettingsResponseSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  logo_url: z.string().nullable(),
  footer_text: z.string().nullable(),
  default_meta_description: z.string().nullable(),
  contact_email: z.string().nullable(),
  updated_at: z.string().optional(),
});

const ContactSubmissionCreatedSchema = z.object({
  id: z.string(),
  created: z.literal(true),
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

export const GetEventsFeedOutputSchema = z.array(EventFeedItemSchema);
export const GetMembersFeedOutputSchema = z.array(MemberFeedItemSchema);
export const GetBlogPublishedOutputSchema = z.array(BlogPostResponseSchema);
export const GetBlogBySlugOutputSchema = BlogPostResponseSchema;
export const GetPagesOutputSchema = z.array(SitePageResponseSchema);
export const GetPageBySlugOutputSchema = SitePageResponseSchema;
export const GetPageByIdOutputSchema = SitePageResponseSchema;
export const SubmitContactOutputSchema = ContactSubmissionCreatedSchema;
export const SubmitContactMemberOutputSchema = ContactSubmissionCreatedSchema;
export const GetMenusOutputSchema = z.record(z.string(), z.array(MenuItemResponseSchema));
export const GetSettingsOutputSchema = SiteSettingsResponseSchema;

// ----- Inferred output types -----

export type GetEventsFeedOutput = z.infer<typeof GetEventsFeedOutputSchema>;
export type GetMembersFeedOutput = z.infer<typeof GetMembersFeedOutputSchema>;
export type GetBlogPublishedOutput = z.infer<typeof GetBlogPublishedOutputSchema>;
export type GetBlogBySlugOutput = z.infer<typeof GetBlogBySlugOutputSchema>;
export type GetPagesOutput = z.infer<typeof GetPagesOutputSchema>;
export type GetPageBySlugOutput = z.infer<typeof GetPageBySlugOutputSchema>;
export type GetPageByIdOutput = z.infer<typeof GetPageByIdOutputSchema>;
export type SubmitContactOutput = z.infer<typeof SubmitContactOutputSchema>;
export type SubmitContactMemberOutput = z.infer<typeof SubmitContactMemberOutputSchema>;
export type GetMenusOutput = z.infer<typeof GetMenusOutputSchema>;
export type GetSettingsOutput = z.infer<typeof GetSettingsOutputSchema>;
