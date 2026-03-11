import sharp from "sharp";

export interface ResizeOptions {
  /** Target width in pixels */
  width: number;
  /** Target height in pixels */
  height: number;
  /** Fit mode: 'cover' crops to fill, 'contain' fits inside, 'fill' stretches */
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  /** JPEG quality 1-100 (default 85) */
  quality?: number;
  /** Output format (default: jpeg) */
  format?: "jpeg" | "png" | "webp";
}

const DEFAULT_OPTIONS: Partial<ResizeOptions> = {
  fit: "cover",
  quality: 85,
  format: "jpeg",
};

/**
 * Generic image resizing and optimization service.
 * Use for thumbnails, avatars, and other sized variants of uploaded images.
 */
export class ImageService {
  /**
   * Resize and optimize an image from a buffer.
   * @param input - Raw image buffer (any supported format: JPEG, PNG, WebP, etc.)
   * @param options - Resize dimensions and quality settings
   * @returns Optimized image as Buffer, or null if processing fails
   */
  static async resize(input: Buffer, options: ResizeOptions): Promise<Buffer | null> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    try {
      let pipeline = sharp(input).resize(opts.width, opts.height, { fit: opts.fit }).rotate(); // Auto-rotate based on EXIF

      switch (opts.format) {
        case "png":
          pipeline = pipeline.png();
          break;
        case "webp":
          pipeline = pipeline.webp({ quality: opts.quality ?? 85 });
          break;
        default:
          pipeline = pipeline.jpeg({
            quality: opts.quality ?? 85,
            mozjpeg: true,
          });
      }

      return await pipeline.toBuffer();
    } catch {
      return null;
    }
  }

  /**
   * Create a small thumbnail suitable for chips and avatars.
   * 64x64 cover crop, optimized JPEG.
   */
  static async createThumbnail(input: Buffer): Promise<Buffer | null> {
    return this.resize(input, {
      width: 64,
      height: 64,
      fit: "cover",
      quality: 80,
      format: "jpeg",
    });
  }

  /**
   * Create a medium-sized image for profile cards (128x128).
   */
  static async createMedium(input: Buffer): Promise<Buffer | null> {
    return this.resize(input, {
      width: 128,
      height: 128,
      fit: "cover",
      quality: 85,
      format: "jpeg",
    });
  }

  /**
   * Create a display-sized image for dossier/main photo (256x256).
   * Optimized for quality at moderate filesize.
   */
  static async createDisplay(input: Buffer): Promise<Buffer | null> {
    return this.resize(input, {
      width: 256,
      height: 256,
      fit: "cover",
      quality: 85,
      format: "jpeg",
    });
  }

  /**
   * Optimize a full-size image (resize to max dimensions if larger, compress with mozjpeg).
   * Use when you want to limit file size of stored originals while keeping high resolution and quality.
   */
  static async optimize(
    input: Buffer,
    maxWidth = 2560,
    maxHeight = 2560,
    quality = 90,
  ): Promise<Buffer | null> {
    try {
      const metadata = await sharp(input).metadata();
      const w = metadata.width ?? 0;
      const h = metadata.height ?? 0;

      let pipeline = sharp(input).rotate();

      if (w > maxWidth || h > maxHeight) {
        pipeline = pipeline.resize(maxWidth, maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      return await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    } catch {
      return null;
    }
  }
}
