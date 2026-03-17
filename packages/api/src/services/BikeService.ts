import type { DataSource } from "typeorm";
import type {
  Bike as BikeOutput,
  BikeCreateInput,
  BikeUpdateInput,
  BikeListOutput,
  BikeDeleteOutput,
  BikeSetPrimaryOutput,
  BikePhotoUploadOutput,
  BikePhotoDeleteOutput,
} from "@satyrsmc/shared/dto/member/bike";
import { Bike } from "../entities/Bike";
import { ImageService } from "./ImageService";
import { toISOStringOrNull } from "../lib/date";
import { uuid, parsePhotoToBlob } from "./utils";

function bikeToOutput(b: Bike): BikeOutput {
  return {
    id: b.id,
    year: b.year,
    make: b.make,
    model: b.model,
    trim: b.trim,
    mods: b.mods,
    has_photo: b.photo !== null && b.photo !== undefined,
    is_primary: b.isPrimary,
    created_at: toISOStringOrNull(b.createdAt),
    updated_at: toISOStringOrNull(b.updatedAt),
  };
}

export class BikeService {
  constructor(private ds: DataSource) {}

  async listByUser(userId: string): Promise<BikeListOutput> {
    const bikes = await this.ds
      .getRepository(Bike)
      .find({ where: { userId }, order: { isPrimary: "DESC", createdAt: "ASC" } });

    return { items: bikes.map(bikeToOutput) };
  }

  async create(userId: string, input: BikeCreateInput): Promise<BikeOutput> {
    const repo = this.ds.getRepository(Bike);

    // If first bike for user, auto-set primary
    const existingCount = await repo.count({ where: { userId } });
    const isPrimary = existingCount === 0;

    const bike = repo.create({
      id: uuid(),
      userId,
      year: input.year,
      make: input.make,
      model: input.model,
      trim: input.trim ?? null,
      mods: input.mods ?? null,
      photo: null,
      photoThumbnail: null,
      isPrimary,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await repo.save(bike);
    return bikeToOutput(bike);
  }

  async update(userId: string, input: BikeUpdateInput): Promise<BikeOutput | null> {
    const repo = this.ds.getRepository(Bike);
    const bike = await repo.findOne({ where: { id: input.id, userId } });
    if (!bike) return null;

    if (input.year !== undefined) bike.year = input.year;
    if (input.make !== undefined) bike.make = input.make;
    if (input.model !== undefined) bike.model = input.model;
    if (input.trim !== undefined) bike.trim = input.trim ?? null;
    if (input.mods !== undefined) bike.mods = input.mods ?? null;
    bike.updatedAt = new Date();

    await repo.save(bike);
    return bikeToOutput(bike);
  }

  async delete(userId: string, bikeId: string): Promise<BikeDeleteOutput> {
    const repo = this.ds.getRepository(Bike);
    const bike = await repo.findOne({ where: { id: bikeId, userId } });
    if (!bike) throw new Error("Bike not found");

    const wasPrimary = bike.isPrimary;
    await repo.remove(bike);

    // If deleted bike was primary, promote oldest remaining
    if (wasPrimary) {
      const oldest = await repo.findOne({
        where: { userId },
        order: { createdAt: "ASC" },
      });
      if (oldest) {
        oldest.isPrimary = true;
        await repo.save(oldest);
      }
    }

    return { success: true };
  }

  async setPrimary(userId: string, bikeId: string): Promise<BikeSetPrimaryOutput> {
    const repo = this.ds.getRepository(Bike);
    const bike = await repo.findOne({ where: { id: bikeId, userId } });
    if (!bike) throw new Error("Bike not found");

    // Use a transaction to ensure consistency
    await this.ds.transaction(async (manager) => {
      const txRepo = manager.getRepository(Bike);
      // Unset all primary for this user
      await txRepo.update({ userId }, { isPrimary: false });
      // Set target as primary
      await txRepo.update({ id: bikeId }, { isPrimary: true });
    });

    return { success: true };
  }

  async uploadPhoto(
    userId: string,
    bikeId: string,
    base64Photo: string,
  ): Promise<BikePhotoUploadOutput> {
    const repo = this.ds.getRepository(Bike);
    const bike = await repo.findOne({ where: { id: bikeId, userId } });
    if (!bike) throw new Error("Bike not found");

    const photoBlob = parsePhotoToBlob(base64Photo);
    if (!photoBlob) throw new Error("Invalid photo data");

    const optimized = await ImageService.optimize(photoBlob);
    const thumbnail = await ImageService.createThumbnail(photoBlob);

    bike.photo = optimized;
    bike.photoThumbnail = thumbnail;
    bike.updatedAt = new Date();
    await repo.save(bike);

    return { success: true };
  }

  async getPhoto(bikeId: string, size: "thumbnail" | "full"): Promise<Buffer | null> {
    const repo = this.ds.getRepository(Bike);
    const bike = await repo.findOne({ where: { id: bikeId } });
    if (!bike) return null;

    if (size === "thumbnail") {
      return bike.photoThumbnail ? Buffer.from(bike.photoThumbnail) : null;
    }
    return bike.photo ? Buffer.from(bike.photo) : null;
  }

  async deletePhoto(userId: string, bikeId: string): Promise<BikePhotoDeleteOutput> {
    const repo = this.ds.getRepository(Bike);
    const bike = await repo.findOne({ where: { id: bikeId, userId } });
    if (!bike) throw new Error("Bike not found");

    bike.photo = null;
    bike.photoThumbnail = null;
    bike.updatedAt = new Date();
    await repo.save(bike);

    return { success: true };
  }
}
