import { describe, it, expect } from "bun:test";
import { isValidUuid } from "./uuid";

describe("isValidUuid", () => {
  it("returns true for a valid v4 UUID", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("returns true for an uppercase UUID", () => {
    expect(isValidUuid("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("returns true for a mixed-case UUID", () => {
    expect(isValidUuid("550e8400-E29B-41d4-A716-446655440000")).toBe(true);
  });

  it("returns false for a too-short string", () => {
    expect(isValidUuid("550e8400-e29b-41d4")).toBe(false);
  });

  it("returns false for a UUID missing dashes", () => {
    expect(isValidUuid("550e8400e29b41d4a716446655440000")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isValidUuid("")).toBe(false);
  });

  it("returns false for a random string", () => {
    expect(isValidUuid("hello")).toBe(false);
  });

  it("returns false for an almost-valid UUID with wrong length", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-44665544000")).toBe(false);
  });

  it("returns true for a UUID with all f's", () => {
    expect(isValidUuid("ffffffff-ffff-ffff-ffff-ffffffffffff")).toBe(true);
  });
});
