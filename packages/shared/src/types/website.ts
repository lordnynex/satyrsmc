export interface SitePageResponse {
  id: string;
  slug: string;
  title: string;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SiteSettingsResponse {
  id: string;
  title: string | null;
  logo_url: string | null;
  footer_text: string | null;
  default_meta_description: string | null;
  contact_email: string | null;
  updated_at?: string;
}

export interface BlogPostResponse {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at?: string;
  updated_at?: string;
}
