import { describe, it, expect } from "bun:test";
import { formatDateOnly, toDateOnly, toDateTimeLocal, formatDateTime, MONTHS } from "./date-utils";

describe("formatDateOnly", () => {
  it("formats a valid ISO string", () => {
    expect(formatDateOnly("2025-03-10T00:00:00.000Z")).toBe("3/10/2025");
  });

  it("formats a YYYY-MM-DD string", () => {
    expect(formatDateOnly("2025-03-10")).toBe("3/10/2025");
  });

  it("returns empty string for empty input", () => {
    expect(formatDateOnly("")).toBe("");
  });

  it("formats different months correctly", () => {
    expect(formatDateOnly("2025-01-05")).toBe("1/5/2025");
    expect(formatDateOnly("2025-12-25")).toBe("12/25/2025");
  });

  it("formats single-digit days without padding", () => {
    expect(formatDateOnly("2025-06-01")).toBe("6/1/2025");
  });
});

describe("toDateOnly", () => {
  it("extracts date from full ISO string", () => {
    expect(toDateOnly("2025-03-10T14:30:00.000Z")).toBe("2025-03-10");
  });

  it("returns date-only string as-is", () => {
    expect(toDateOnly("2025-03-10")).toBe("2025-03-10");
  });

  it("returns empty string for null", () => {
    expect(toDateOnly(null as unknown as string)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(toDateOnly(undefined as unknown as string)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(toDateOnly("")).toBe("");
  });

  it("returns empty string for non-string input", () => {
    expect(toDateOnly(12345 as unknown as string)).toBe("");
  });
});

describe("toDateTimeLocal", () => {
  it("converts valid ISO to datetime-local format", () => {
    const result = toDateTimeLocal("2025-03-10T14:30:00.000Z");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("returns empty string for null", () => {
    expect(toDateTimeLocal(null as unknown as string)).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(toDateTimeLocal("not-a-date")).toBe("");
  });
});

describe("formatDateTime", () => {
  it("formats valid ISO to readable date-time", () => {
    const result = formatDateTime("2025-03-10T14:30:00.000Z");
    // The exact time depends on local timezone, but format should match M/D/YYYY, h:mm AM/PM
    expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2} (AM|PM)$/);
  });

  it("returns empty string for null", () => {
    expect(formatDateTime(null as unknown as string)).toBe("");
  });

  it("returns original string for invalid date", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
  });
});

describe("MONTHS", () => {
  it("has 12 entries", () => {
    expect(MONTHS).toHaveLength(12);
  });

  it("starts with January", () => {
    expect(MONTHS[0]).toBe("January");
  });

  it("ends with December", () => {
    expect(MONTHS[11]).toBe("December");
  });
});
