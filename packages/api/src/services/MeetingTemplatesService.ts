import { In } from "typeorm";
import type { DataSource } from "typeorm";
import { Document, MeetingTemplate } from "../entities";
import { uuid } from "./utils";
import { toISOString } from "../lib/date";
import type {
  MeetingTemplateCreateOutput,
  MeetingTemplateDeleteOutput,
  MeetingTemplateGetOutput,
  MeetingTemplateListOutput,
  MeetingTemplateUpdateOutput,
} from "@satyrsmc/shared/dto/admin/meeting";

const EMPTY_DOC = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

export class MeetingTemplatesService {
  constructor(private ds: DataSource) {}

  private templateToApi(t: MeetingTemplate, doc: Document | null): MeetingTemplateGetOutput {
    return {
      id: t.id,
      name: t.name,
      type: t.type as "agenda" | "minutes",
      document_id: t.documentId,
      content: doc?.content ?? EMPTY_DOC,
      created_at: toISOString(t.createdAt),
      updated_at: toISOString(t.updatedAt),
    };
  }

  async list(type?: "agenda" | "minutes"): Promise<MeetingTemplateListOutput> {
    const repo = this.ds.getRepository(MeetingTemplate);
    const findOptions: Parameters<typeof repo.find>[0] = {
      order: { name: "ASC" },
    };
    if (type) {
      findOptions.where = { type };
    }
    const entities = await repo.find(findOptions);
    const docIds = entities.map((t) => t.documentId);
    const docs =
      docIds.length > 0
        ? await this.ds.getRepository(Document).find({ where: { id: In(docIds) } })
        : [];
    const docMap = new Map(docs.map((d) => [d.id, d]));
    return entities.map((t) => this.templateToApi(t, docMap.get(t.documentId) ?? null));
  }

  async get(id: string): Promise<MeetingTemplateGetOutput | null> {
    const template = await this.ds.getRepository(MeetingTemplate).findOne({ where: { id } });
    if (!template) return null;
    const doc = await this.ds
      .getRepository(Document)
      .findOne({ where: { id: template.documentId } });
    return this.templateToApi(template, doc);
  }

  async create(body: {
    name: string;
    type: string;
    content: string;
  }): Promise<MeetingTemplateCreateOutput> {
    const now = new Date().toISOString();
    const doc = this.ds.getRepository(Document).create({
      id: uuid(),
      content: body.content ?? EMPTY_DOC,
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(Document).save(doc);
    const template = this.ds.getRepository(MeetingTemplate).create({
      id: uuid(),
      name: body.name,
      type: body.type,
      documentId: doc.id,
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(MeetingTemplate).save(template);
    return this.templateToApi(template, doc);
  }

  async update(
    id: string,
    body: Record<string, unknown>,
  ): Promise<MeetingTemplateUpdateOutput | null> {
    const template = await this.ds.getRepository(MeetingTemplate).findOne({ where: { id } });
    if (!template) return null;
    const updates: Partial<MeetingTemplate> = {};
    if (body.name !== undefined) updates.name = body.name as string;
    if (body.type !== undefined) updates.type = body.type as string;
    updates.updatedAt = new Date();
    await this.ds.getRepository(MeetingTemplate).update(id, updates);
    const updated = await this.ds.getRepository(MeetingTemplate).findOne({ where: { id } });
    if (!updated) return null;
    const doc = await this.ds
      .getRepository(Document)
      .findOne({ where: { id: updated.documentId } });
    return this.templateToApi(updated, doc);
  }

  async delete(id: string): Promise<MeetingTemplateDeleteOutput> {
    await this.ds.getRepository(MeetingTemplate).delete(id);
    return { ok: true as const };
  }
}
