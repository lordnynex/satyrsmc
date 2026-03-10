import type { DataSource } from "typeorm";
import { SitePage } from "../entities";
import { uuid } from "./utils";
import { toISOString } from "../lib/date";

const EMPTY_DOC = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

export interface SitePagePayload {
  id?: string;
  slug: string;
  title: string;
  body?: string;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface SitePageResponse {
  id: string;
  slug: string;
  title: string;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string | undefined;
  updated_at: string | undefined;
}

export class SitePagesService {
  constructor(private ds: DataSource) {}

  async list(): Promise<SitePageResponse[]> {
    const pages = await this.ds.getRepository(SitePage).find({
      order: { slug: "ASC" },
    });
    return pages.map((p) => this.toResponse(p));
  }

  async getById(id: string): Promise<SitePageResponse | null> {
    const page = await this.ds.getRepository(SitePage).findOne({ where: { id } });
    return page ? this.toResponse(page) : null;
  }

  async getBySlug(slug: string): Promise<SitePageResponse | null> {
    const page = await this.ds.getRepository(SitePage).findOne({ where: { slug } });
    return page ? this.toResponse(page) : null;
  }

  async create(body: SitePagePayload): Promise<SitePageResponse> {
    const now = new Date().toISOString();
    const page = this.ds.getRepository(SitePage).create({
      id: body.id ?? uuid(),
      slug: body.slug,
      title: body.title,
      body: body.body ?? EMPTY_DOC,
      metaTitle: body.meta_title ?? null,
      metaDescription: body.meta_description ?? null,
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(SitePage).save(page);
    return this.toResponse(page);
  }

  async update(id: string, body: Partial<SitePagePayload>): Promise<SitePageResponse | null> {
    const page = await this.ds.getRepository(SitePage).findOne({ where: { id } });
    if (!page) return null;

    const now = new Date().toISOString();
    if (body.slug !== undefined) page.slug = body.slug;
    if (body.title !== undefined) page.title = body.title;
    if (body.body !== undefined) page.body = body.body;
    if (body.meta_title !== undefined) page.metaTitle = body.meta_title;
    if (body.meta_description !== undefined) page.metaDescription = body.meta_description;
    page.updatedAt = now;

    await this.ds.getRepository(SitePage).save(page);
    return this.toResponse(page);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ds.getRepository(SitePage).delete({ id });
    return (result.affected ?? 0) > 0;
  }

  private toResponse(p: SitePage): SitePageResponse {
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      body: p.body,
      meta_title: p.metaTitle ?? null,
      meta_description: p.metaDescription ?? null,
      created_at: toISOString(p.createdAt),
      updated_at: toISOString(p.updatedAt),
    };
  }
}
