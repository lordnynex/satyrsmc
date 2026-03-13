import { describe, expect, test } from "bun:test";
import { AVERY_5161, AVERY_5162, AVERY_5163, AVERY_5164, generatePdfLabels } from "./pdf-labels";
import type { LabelRecipient } from "./pdf-labels";

describe("PDF labels", () => {
  test("generates PDF blob for recipients", () => {
    const recipients = [
      {
        name: "John Doe",
        addressLine1: "123 Main St",
        addressLine2: "Apt 4",
        city: "Madison",
        state: "WI",
        postalCode: "53703",
        country: "US",
      },
    ];
    const blob = generatePdfLabels(recipients);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain("pdf");
    expect(blob.size).toBeGreaterThan(100);
  });

  test("handles multiple recipients", () => {
    const recipients = [
      { name: "A", addressLine1: "1 St", city: "City", state: "ST", postalCode: "12345" },
      { name: "B", addressLine1: "2 St", city: "City", state: "ST", postalCode: "12345" },
    ];
    const blob = generatePdfLabels(recipients);
    expect(blob.size).toBeGreaterThan(200);
  });

  test("includes organization when option set", () => {
    const recipients = [
      {
        name: "Jane",
        addressLine1: "100 Org Way",
        city: "Chicago",
        state: "IL",
        postalCode: "60601",
        organization: "Acme Corp",
      },
    ];
    const blob = generatePdfLabels(recipients, { includeOrganization: true });
    expect(blob.size).toBeGreaterThan(100);
  });

  describe("Avery layout variants", () => {
    const singleRecipient: LabelRecipient[] = [
      {
        name: "Test Person",
        addressLine1: "1 Label Ln",
        city: "Print City",
        state: "PC",
        postalCode: "00001",
      },
    ];

    test("Avery 5161 generates a valid PDF blob", () => {
      const blob = generatePdfLabels(singleRecipient, { layout: AVERY_5161 });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toContain("pdf");
      expect(blob.size).toBeGreaterThan(100);
    });

    test("Avery 5162 generates a valid PDF blob", () => {
      const blob = generatePdfLabels(singleRecipient, { layout: AVERY_5162 });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toContain("pdf");
      expect(blob.size).toBeGreaterThan(100);
    });

    test("Avery 5163 generates a valid PDF blob", () => {
      const blob = generatePdfLabels(singleRecipient, { layout: AVERY_5163 });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toContain("pdf");
      expect(blob.size).toBeGreaterThan(100);
    });

    test("Avery 5164 generates a valid PDF blob", () => {
      const blob = generatePdfLabels(singleRecipient, { layout: AVERY_5164 });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toContain("pdf");
      expect(blob.size).toBeGreaterThan(100);
    });
  });

  test("return address option produces a larger PDF", () => {
    const recipients: LabelRecipient[] = [
      {
        name: "Recipient One",
        addressLine1: "42 Maple Dr",
        city: "Townsville",
        state: "TS",
        postalCode: "11111",
      },
    ];

    const withoutReturn = generatePdfLabels(recipients);
    const withReturn = generatePdfLabels(recipients, {
      returnAddress: "Satyr Society\n100 Greek Way\nMadison, WI 53703",
    });

    expect(withReturn).toBeInstanceOf(Blob);
    expect(withReturn.type).toContain("pdf");
    expect(withReturn.size).toBeGreaterThan(withoutReturn.size);
  });

  test("empty recipients array generates a valid PDF", () => {
    const blob = generatePdfLabels([]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain("pdf");
    expect(blob.size).toBeGreaterThan(0);
  });

  test("missing optional fields (no addressLine2, no country) generates without error", () => {
    const recipients: LabelRecipient[] = [
      {
        name: "Minimal Recipient",
        addressLine1: "99 Sparse Rd",
        city: "Bareville",
        state: "BV",
        postalCode: "00000",
      },
    ];

    const blob = generatePdfLabels(recipients);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain("pdf");
    expect(blob.size).toBeGreaterThan(100);
  });

  test("pagination — 100 recipients produces a larger PDF than 1 recipient", () => {
    const makeRecipient = (i: number): LabelRecipient => ({
      name: `Person ${i}`,
      addressLine1: `${i} Street Ave`,
      city: "Bigtown",
      state: "BT",
      postalCode: String(10000 + i),
    });

    const oneBlob = generatePdfLabels([makeRecipient(1)]);
    const manyRecipients = Array.from({ length: 100 }, (_, i) => makeRecipient(i + 1));
    const manyBlob = generatePdfLabels(manyRecipients);

    expect(manyBlob).toBeInstanceOf(Blob);
    expect(manyBlob.type).toContain("pdf");
    expect(manyBlob.size).toBeGreaterThan(oneBlob.size);
  });

  test("custom fontSize option produces a valid PDF", () => {
    const recipients: LabelRecipient[] = [
      {
        name: "Fonty McFontface",
        addressLine1: "7 Type Blvd",
        city: "Serifville",
        state: "SF",
        postalCode: "22222",
      },
    ];

    const blob = generatePdfLabels(recipients, { fontSize: 14 });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain("pdf");
    expect(blob.size).toBeGreaterThan(100);
  });
});
