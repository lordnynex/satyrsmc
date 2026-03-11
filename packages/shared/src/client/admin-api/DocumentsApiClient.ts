import type { TrpcClient } from "../trpc";
import type { DocumentGetOutput, DocumentGetVersionsOutput } from "@satyrsmc/shared/dto/admin/document";

export class DocumentsApiClient {
  constructor(private client: TrpcClient) {}

  get(id: string): Promise<DocumentGetOutput | null> {
    return this.client.admin.documents.get.query({ id });
  }

  update(id: string, body: { content: string }) {
    return this.client.admin.documents.update.mutate({
      id,
      content: body.content,
    });
  }

  getVersions(id: string): Promise<DocumentGetVersionsOutput> {
    return this.client.admin.documents.getVersions.query({ id });
  }

  restore(id: string, versionId: string) {
    return this.client.admin.documents.restore.mutate({ id, versionId });
  }

  async exportPdf(documentId: string, filename: string): Promise<void> {
    const { base64 } = await this.client.admin.documents.exportPdf.query({
      id: documentId,
    });
    const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bin], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
