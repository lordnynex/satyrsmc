import type { DataSource } from "typeorm";
import { SiteSettings } from "../entities";
import { toISOString } from "../lib/date";

const DEFAULT_ID = "default";

export interface SiteSettingsPayload {
  title?: string | null;
  logo_url?: string | null;
  footer_text?: string | null;
  default_meta_description?: string | null;
  contact_email?: string | null;
}

export interface SiteSettingsResponse {
  id: string;
  title: string | null;
  logo_url: string | null;
  footer_text: string | null;
  default_meta_description: string | null;
  contact_email: string | null;
  updated_at: string | undefined;
}

export class SiteSettingsService {
  constructor(private ds: DataSource) {}

  async get(): Promise<SiteSettingsResponse> {
    let row = await this.ds.getRepository(SiteSettings).findOne({ where: { id: DEFAULT_ID } });
    if (!row) {
      const repo = this.ds.getRepository(SiteSettings);
      row = repo.create({
        id: DEFAULT_ID,
        title: null,
        logoUrl: null,
        footerText: null,
        defaultMetaDescription: null,
        contactEmail: null,
        updatedAt: new Date().toISOString(),
      });
      await repo.save(row);
    }
    return this.toResponse(row);
  }

  async update(body: SiteSettingsPayload): Promise<SiteSettingsResponse> {
    const repo = this.ds.getRepository(SiteSettings);
    let row = await repo.findOne({ where: { id: DEFAULT_ID } });
    if (!row) {
      row = repo.create({
        id: DEFAULT_ID,
        title: null,
        logoUrl: null,
        footerText: null,
        defaultMetaDescription: null,
        contactEmail: null,
        updatedAt: new Date().toISOString(),
      });
      await repo.save(row);
    }

    const now = new Date().toISOString();
    if (body.title !== undefined) row.title = body.title;
    if (body.logo_url !== undefined) row.logoUrl = body.logo_url;
    if (body.footer_text !== undefined) row.footerText = body.footer_text;
    if (body.default_meta_description !== undefined)
      row.defaultMetaDescription = body.default_meta_description;
    if (body.contact_email !== undefined) row.contactEmail = body.contact_email;
    row.updatedAt = now;

    await repo.save(row);
    return this.toResponse(row);
  }

  private toResponse(s: SiteSettings): SiteSettingsResponse {
    return {
      id: s.id,
      title: s.title ?? null,
      logo_url: s.logoUrl ?? null,
      footer_text: s.footerText ?? null,
      default_meta_description: s.defaultMetaDescription ?? null,
      contact_email: s.contactEmail ?? null,
      updated_at: toISOString(s.updatedAt),
    };
  }
}
