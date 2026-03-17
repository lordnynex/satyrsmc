import { describe, test, expect } from "bun:test";
import {
  BikeCreateInputSchema,
  BikeUpdateInputSchema,
  BikeSetPrimaryInputSchema,
  BikePhotoUploadInputSchema,
} from "../bike";

describe("BikeCreateInputSchema", () => {
  test("requires year, make, model", () => {
    const result = BikeCreateInputSchema.safeParse({});
    expect(result.success).toBe(false);

    const issues = result.error!.issues.map((i) => i.path[0]);
    expect(issues).toContain("year");
    expect(issues).toContain("make");
    expect(issues).toContain("model");
  });

  test("rejects year < 1900", () => {
    const result = BikeCreateInputSchema.safeParse({
      year: 1899,
      make: "Honda",
      model: "CBR",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Year must be 1900 or later");
  });

  test("allows optional trim, mods", () => {
    const result = BikeCreateInputSchema.safeParse({
      year: 2020,
      make: "Yamaha",
      model: "MT-07",
      trim: "ABS",
      mods: "Exhaust, fender eliminator",
    });
    expect(result.success).toBe(true);
  });

  test("rejects mods > 500 chars", () => {
    const result = BikeCreateInputSchema.safeParse({
      year: 2020,
      make: "Yamaha",
      model: "MT-07",
      mods: "X".repeat(501),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("mods"))).toBe(true);
  });
});

describe("BikeUpdateInputSchema", () => {
  test("requires id", () => {
    const result = BikeUpdateInputSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("id"))).toBe(true);
  });
});

describe("BikePhotoUploadInputSchema", () => {
  test("requires id and photo", () => {
    const result = BikePhotoUploadInputSchema.safeParse({});
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path[0]);
    expect(paths).toContain("id");
    expect(paths).toContain("photo");
  });

  test("rejects empty photo string", () => {
    const result = BikePhotoUploadInputSchema.safeParse({
      id: "bike-1",
      photo: "",
    });
    expect(result.success).toBe(false);
  });

  test("accepts valid input", () => {
    const result = BikePhotoUploadInputSchema.safeParse({
      id: "bike-1",
      photo: "base64data",
    });
    expect(result.success).toBe(true);
  });
});

describe("BikeSetPrimaryInputSchema", () => {
  test("requires id", () => {
    const result = BikeSetPrimaryInputSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("id"))).toBe(true);
  });
});
