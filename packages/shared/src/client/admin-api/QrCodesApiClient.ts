import type { TrpcClient } from "../trpc";
import type { QrCode, QrCodeConfig } from "@satyrsmc/shared/dto/admin/qrCode";

export class QrCodesApiClient {
  constructor(private client: TrpcClient) {}

  async list(): Promise<QrCode[]> {
    const data = await this.client.admin.qrCodes.list.query();
    return Array.isArray(data) ? data : [];
  }

  get(id: string) {
    return this.client.admin.qrCodes.get.query({ id });
  }

  async getImageUrl(id: string, size?: number): Promise<string> {
    const r = await this.client.admin.qrCodes.getImage.query({ id, size });
    return `data:${r.contentType};base64,${r.base64}`;
  }

  create(body: {
    name?: string | null;
    url: string;
    config?: QrCodeConfig | null;
  }) {
    return this.client.admin.qrCodes.create.mutate(body as never);
  }

  update(
    id: string,
    body: {
      name?: string | null;
      url?: string;
      config?: QrCodeConfig | null;
    }
  ) {
    return this.client.admin.qrCodes.update.mutate({ id, ...body } as never);
  }

  delete(id: string) {
    return this.client.admin.qrCodes.delete.mutate({ id });
  }
}
