import type { DataSource } from "typeorm";
import { SiteSettings } from "../entities";
import { toISOString } from "../lib/date";
import type {
  SiteSettingsResponse,
  SiteSettingsUpdateInput,
  WebsiteAdminGetSettingsOutput,
  WebsiteAdminUpdateSettingsOutput,
} from "@satyrsmc/shared/dto/admin/websiteAdmin";

const DEFAULT_ID = "default";

export class SiteSettingsService {
  constructor(private ds: DataSource) {}

  async get(): Promise<WebsiteAdminGetSettingsOutput> {
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

  async update(body: SiteSettingsUpdateInput): Promise<WebsiteAdminUpdateSettingsOutput> {
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

    if (body.title !== undefined) row.title = body.title;
    if (body.logo_url !== undefined) row.logoUrl = body.logo_url;
    if (body.footer_text !== undefined) row.footerText = body.footer_text;
    if (body.default_meta_description !== undefined)
      row.defaultMetaDescription = body.default_meta_description;
    if (body.contact_email !== undefined) row.contactEmail = body.contact_email;
    row.updatedAt = new Date();

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
