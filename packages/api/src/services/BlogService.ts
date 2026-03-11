import type { DataSource } from "typeorm";
import { BlogPost } from "../entities";
import { uuid } from "./utils";
import { toISOString, toISOStringOrNull } from "../lib/date";
import type {
  BlogPostCreateInput,
  BlogPostResponse,
  BlogPostUpdateInput,
  WebsiteAdminGetBlogByIdOutput,
  WebsiteAdminListBlogAllOutput,
} from "@satyrsmc/shared/dto/admin/websiteAdmin";

const EMPTY_DOC = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

export class BlogService {
  constructor(private ds: DataSource) {}

  async listPublished(limit = 50): Promise<WebsiteAdminListBlogAllOutput> {
    const posts = await this.ds.getRepository(BlogPost).find({
      where: {},
      order: { publishedAt: "DESC", createdAt: "DESC" },
      take: limit,
    });
    return posts.filter((p) => p.publishedAt != null).map((p) => this.toResponse(p));
  }

  async listAll(): Promise<WebsiteAdminListBlogAllOutput> {
    const posts = await this.ds.getRepository(BlogPost).find({
      order: { createdAt: "DESC" },
    });
    return posts.map((p) => this.toResponse(p));
  }

  async getBySlug(slug: string): Promise<BlogPostResponse | null> {
    const post = await this.ds.getRepository(BlogPost).findOne({ where: { slug } });
    return post ? this.toResponse(post) : null;
  }

  async getById(id: string): Promise<BlogPostResponse | null> {
    const post = await this.ds.getRepository(BlogPost).findOne({ where: { id } });
    return post ? this.toResponse(post) : null;
  }

  async create(body: BlogPostCreateInput): Promise<BlogPostResponse> {
    const now = new Date().toISOString();
    const post = this.ds.getRepository(BlogPost).create({
      id: uuid(),
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt ?? null,
      body: body.body ?? EMPTY_DOC,
      publishedAt: body.published_at ?? null,
      metaTitle: body.meta_title ?? null,
      metaDescription: body.meta_description ?? null,
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(BlogPost).save(post);
    return this.toResponse(post);
  }

  async update(id: string, body: Partial<BlogPostUpdateInput>): Promise<BlogPostResponse | null> {
    const post = await this.ds.getRepository(BlogPost).findOne({ where: { id } });
    if (!post) return null;
    if (body.slug !== undefined) post.slug = body.slug;
    if (body.title !== undefined) post.title = body.title;
    if (body.excerpt !== undefined) post.excerpt = body.excerpt;
    if (body.body !== undefined) post.body = body.body;
    if (body.published_at !== undefined)
      post.publishedAt = body.published_at != null ? new Date(body.published_at) : null;
    if (body.meta_title !== undefined) post.metaTitle = body.meta_title;
    if (body.meta_description !== undefined) post.metaDescription = body.meta_description;
    post.updatedAt = new Date();
    await this.ds.getRepository(BlogPost).save(post);
    return this.toResponse(post);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ds.getRepository(BlogPost).delete({ id });
    return (result.affected ?? 0) > 0;
  }

  private toResponse(p: BlogPost): WebsiteAdminGetBlogByIdOutput {
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? null,
      body: p.body,
      published_at: toISOStringOrNull(p.publishedAt),
      meta_title: p.metaTitle ?? null,
      meta_description: p.metaDescription ?? null,
      created_at: toISOString(p.createdAt),
      updated_at: toISOString(p.updatedAt),
    };
  }
}
