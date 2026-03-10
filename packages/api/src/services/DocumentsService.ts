import type { DataSource } from "typeorm";
import { Document, DocumentVersion } from "../entities";
import { uuid } from "./utils";
import { toISOString } from "../lib/date";
import { tiptapJsonToPdf } from "../lib/tiptapToPdf";
import type {
  DocumentGetOutput,
  DocumentGetVersionsOutput,
  DocumentRestoreOutput,
  DocumentUpdateOutput,
} from "@satyrsmc/shared/dto/admin/document";

const EMPTY_DOC = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

export class DocumentsService {
  constructor(private ds: DataSource) {}

  async get(id: string): Promise<DocumentGetOutput | null> {
    const doc = await this.ds.getRepository(Document).findOne({ where: { id } });
    if (!doc) return null;
    return {
      id: doc.id,
      content: doc.content,
      created_at: toISOString(doc.createdAt),
      updated_at: toISOString(doc.updatedAt),
    };
  }

  async create(content?: string) {
    const now = new Date().toISOString();
    const doc = this.ds.getRepository(Document).create({
      id: uuid(),
      content: content ?? EMPTY_DOC,
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(Document).save(doc);
    return doc;
  }

  async update(id: string, body: { content: string }): Promise<DocumentUpdateOutput | null> {
    const doc = await this.ds.getRepository(Document).findOne({ where: { id } });
    if (!doc) return null;

    const now = new Date().toISOString();

    const maxVersion = await this.ds
      .getRepository(DocumentVersion)
      .createQueryBuilder("v")
      .select("MAX(v.version_number)", "max")
      .where("v.document_id = :id", { id })
      .getRawOne<{ max: number | null }>();
    const nextVersion = (maxVersion?.max ?? 0) + 1;

    const version = this.ds.getRepository(DocumentVersion).create({
      id: uuid(),
      documentId: id,
      content: doc.content,
      versionNumber: nextVersion,
      createdAt: now,
    });
    await this.ds.getRepository(DocumentVersion).save(version);

    await this.ds.getRepository(Document).update(id, {
      content: body.content,
      updatedAt: now,
    });

    const updated = await this.ds.getRepository(Document).findOne({ where: { id } });
    return updated
      ? {
          id: updated.id,
          content: updated.content,
          created_at: toISOString(updated.createdAt),
          updated_at: toISOString(updated.updatedAt),
        }
      : null;
  }

  async listVersions(documentId: string): Promise<DocumentGetVersionsOutput> {
    const versions = await this.ds.getRepository(DocumentVersion).find({
      where: { documentId },
      order: { versionNumber: "DESC" },
    });
    return versions.map((v) => ({
      id: v.id,
      document_id: v.documentId,
      content: v.content,
      version_number: v.versionNumber,
      created_at: toISOString(v.createdAt),
    }));
  }

  async getVersion(documentId: string, versionIdOrNumber: string | number) {
    let version: DocumentVersion | null;
    if (typeof versionIdOrNumber === "number") {
      version = await this.ds.getRepository(DocumentVersion).findOne({
        where: { documentId, versionNumber: versionIdOrNumber },
      });
    } else {
      version = await this.ds.getRepository(DocumentVersion).findOne({
        where: { id: versionIdOrNumber, documentId },
      });
    }
    if (!version) return null;
    return {
      id: version.id,
      document_id: version.documentId,
      content: version.content,
      version_number: version.versionNumber,
      created_at: toISOString(version.createdAt),
    };
  }

  async restore(documentId: string, versionId?: string, versionNumber?: number): Promise<DocumentRestoreOutput | null> {
    const doc = await this.ds.getRepository(Document).findOne({ where: { id: documentId } });
    if (!doc) return null;

    let version: DocumentVersion | null;
    if (versionId) {
      version = await this.ds.getRepository(DocumentVersion).findOne({
        where: { id: versionId, documentId },
      });
    } else if (versionNumber !== undefined) {
      version = await this.ds.getRepository(DocumentVersion).findOne({
        where: { documentId, versionNumber },
      });
    } else {
      return null;
    }
    if (!version) return null;

    return this.update(documentId, { content: version.content });
  }

  async exportPdf(documentId: string): Promise<Buffer | null> {
    const doc = await this.get(documentId);
    if (!doc) return null;
    return tiptapJsonToPdf(doc.content);
  }
}
