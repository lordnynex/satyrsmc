import { describe, it, expect } from "vitest";
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneForStorage } from "./phone";

describe("formatPhoneNumber", () => {
  it("formats 10 digits", () => {
    expect(formatPhoneNumber("5551234567")).toBe("(555) 123-4567");
  });

  it("formats 11 digits with leading 1", () => {
    expect(formatPhoneNumber("15551234567")).toBe("+1 (555) 123-4567");
  });

  it("handles already-formatted input", () => {
    expect(formatPhoneNumber("(555) 123-4567")).toBe("(555) 123-4567");
  });

  it("formats 7 digits", () => {
    expect(formatPhoneNumber("5551234")).toBe("(555) 123-4");
  });

  it("returns empty string for empty input", () => {
    expect(formatPhoneNumber("")).toBe("");
  });

  it("returns empty string for null", () => {
    expect(formatPhoneNumber(null as unknown as string)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatPhoneNumber(undefined as unknown as string)).toBe("");
  });

  it("formats 12+ digit international numbers", () => {
    const result = formatPhoneNumber("445551234567");
    // Should include a + prefix for international numbers
    expect(result).toMatch(/^\+/);
  });
});

describe("isValidPhoneNumber", () => {
  it("returns true for 10 digits", () => {
    expect(isValidPhoneNumber("5551234567")).toBe(true);
  });

  it("returns true for 11 digits", () => {
    expect(isValidPhoneNumber("15551234567")).toBe(true);
  });

  it("returns false for 9 digits", () => {
    expect(isValidPhoneNumber("555123456")).toBe(false);
  });

  it("returns true for formatted number with 10+ digits", () => {
    expect(isValidPhoneNumber("(555) 123-4567")).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidPhoneNumber(null as unknown as string)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidPhoneNumber("")).toBe(false);
  });
});

describe("normalizePhoneForStorage", () => {
  it("strips formatting from phone number", () => {
    expect(normalizePhoneForStorage("(555) 123-4567")).toBe("5551234567");
  });

  it("strips dashes and plus sign", () => {
    expect(normalizePhoneForStorage("+1-555-123-4567")).toBe("15551234567");
  });

  it("returns empty string for null", () => {
    expect(normalizePhoneForStorage(null as unknown as string)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(normalizePhoneForStorage("")).toBe("");
  });
});
