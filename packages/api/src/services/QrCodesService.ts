import type { DataSource } from "typeorm";
import QRCode from "qrcode";
import { QrCode as QrCodeEntity, type QrCodeConfig } from "../entities/QrCode";
import { uuid } from "./utils";
import { toISOStringOrNull } from "../lib/date";

export interface QrCodeRecord {
  id: string;
  name: string | null;
  url: string;
  config: QrCodeConfig | null;
  created_at: string | null;
  updated_at: string | null;
}

const DEFAULT_CONFIG: Required<Omit<QrCodeConfig, "color">> & {
  color: { dark: string; light: string };
} = {
  errorCorrectionLevel: "M",
  width: 256,
  margin: 4,
  color: { dark: "#000000", light: "#ffffff" },
  format: "png",
};

function mergeConfig(partial?: QrCodeConfig | null): QrCodeConfig {
  if (!partial) return DEFAULT_CONFIG;
  return {
    errorCorrectionLevel: partial.errorCorrectionLevel ?? DEFAULT_CONFIG.errorCorrectionLevel,
    width: partial.width ?? DEFAULT_CONFIG.width,
    margin: partial.margin ?? DEFAULT_CONFIG.margin,
    color: {
      dark: partial.color?.dark ?? DEFAULT_CONFIG.color.dark,
      light: partial.color?.light ?? DEFAULT_CONFIG.color.light,
    },
    format: partial.format ?? DEFAULT_CONFIG.format,
  };
}

async function generateQrImage(url: string, config: QrCodeConfig): Promise<Buffer> {
  const opts = {
    errorCorrectionLevel: config.errorCorrectionLevel ?? "M",
    width: config.width ?? 256,
    margin: config.margin ?? 4,
    color: config.color ?? { dark: "#000000", light: "#ffffff" },
  };

  if (config.format === "svg") {
    const svg = await QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: opts.errorCorrectionLevel,
      margin: opts.margin,
      color: opts.color,
    });
    return Buffer.from(svg, "utf8");
  }

  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: opts.errorCorrectionLevel,
    width: opts.width,
    margin: opts.margin,
    color: opts.color,
  }) as Promise<Buffer>;
}

export class QrCodesService {
  constructor(private ds: DataSource) {}

  async list(): Promise<QrCodeRecord[]> {
    const rows = await this.ds.getRepository(QrCodeEntity).find({
      order: { createdAt: "DESC" },
    });
    return rows.map((r) => this.rowToRecord(r));
  }

  async get(id: string): Promise<QrCodeRecord | null> {
    const row = await this.ds.getRepository(QrCodeEntity).findOne({ where: { id } });
    if (!row) return null;
    return this.rowToRecord(row);
  }

  async getImage(id: string, sizeOverride?: number): Promise<{ buffer: Buffer; contentType: string } | null> {
    const row = await this.ds.getRepository(QrCodeEntity).findOne({ where: { id } });
    if (!row) return null;
    const config = row.config ? (JSON.parse(row.config) as QrCodeConfig) : mergeConfig(null);
    const format = config.format ?? "png";

    const useOverride = sizeOverride != null && sizeOverride >= 64 && sizeOverride <= 2048;
    if (useOverride) {
      const sizedConfig = { ...config, width: sizeOverride };
      const imageData = await generateQrImage(row.url, sizedConfig);
      return {
        buffer: imageData,
        contentType: format === "svg" ? "image/svg+xml" : "image/png",
      };
    }

    if (!row.imageData) return null;
    return {
      buffer: row.imageData,
      contentType: format === "svg" ? "image/svg+xml" : "image/png",
    };
  }

  async create(input: {
    name?: string | null;
    url: string;
    config?: QrCodeConfig | null;
  }): Promise<QrCodeRecord> {
    const id = uuid();
    const config = mergeConfig(input.config);
    const imageData = await generateQrImage(input.url, config);
    const now = new Date().toISOString();

    const entity = this.ds.getRepository(QrCodeEntity).create({
      id,
      name: input.name?.trim() || null,
      url: input.url.trim(),
      config: JSON.stringify(config),
      imageData,
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(QrCodeEntity).save(entity);
    return this.rowToRecord(entity);
  }

  async update(
    id: string,
    input: { name?: string | null; url?: string; config?: QrCodeConfig | null }
  ): Promise<QrCodeRecord | null> {
    const row = await this.ds.getRepository(QrCodeEntity).findOne({ where: { id } });
    if (!row) return null;

    const url = input.url !== undefined ? input.url.trim() : row.url;
    const config = input.config !== undefined ? mergeConfig(input.config) : (row.config ? (JSON.parse(row.config) as QrCodeConfig) : mergeConfig(null));
    const imageData = await generateQrImage(url, config);
    const now = new Date().toISOString();

    row.name = input.name !== undefined ? (input.name?.trim() || null) : row.name;
    row.url = url;
    row.config = JSON.stringify(config);
    row.imageData = imageData;
    row.updatedAt = now;
    await this.ds.getRepository(QrCodeEntity).save(row);
    return this.rowToRecord(row);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ds.getRepository(QrCodeEntity).delete(id);
    return (result.affected ?? 0) > 0;
  }

  private rowToRecord(r: QrCodeEntity): QrCodeRecord {
    return {
      id: r.id,
      name: r.name,
      url: r.url,
      config: r.config ? (JSON.parse(r.config) as QrCodeConfig) : null,
      created_at: toISOStringOrNull(r.createdAt),
      updated_at: toISOStringOrNull(r.updatedAt),
    };
  }
}
