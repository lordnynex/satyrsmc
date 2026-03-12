import { describe, expect, test } from "bun:test";
import { parseVCardFile, contactToVCard4, parsedToContactPayload } from "./vcard";
import { ContactType, ContactStatus, ConsentStatus } from "@satyrsmc/shared/client";
import type { Contact } from "@satyrsmc/shared/client";

describe("vCard parsing", () => {
  test("parses single vCard 3.0", () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
N:Doe;John;;;
EMAIL:john@example.com
TEL:555-1234
ADR;TYPE=HOME:;;123 Main St;Madison;WI;53703;US
END:VCARD`;
    const parsed = parseVCardFile(vcf);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.fn).toBe("John Doe");
    expect(parsed[0]!.n?.family).toBe("Doe");
    expect(parsed[0]!.n?.given).toBe("John");
    expect(parsed[0]!.emails[0]?.value).toBe("john@example.com");
    expect(parsed[0]!.tels[0]?.value).toBe("555-1234");
    expect(parsed[0]!.adrs[0]?.line1).toBe("123 Main St");
    expect(parsed[0]!.adrs[0]?.city).toBe("Madison");
    expect(parsed[0]!.adrs[0]?.state).toBe("WI");
    expect(parsed[0]!.adrs[0]?.postalCode).toBe("53703");
  });

  test("parses multiple vCards", () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Alice
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Bob
END:VCARD`;
    const parsed = parseVCardFile(vcf);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]!.fn).toBe("Alice");
    expect(parsed[1]!.fn).toBe("Bob");
  });

  test("parsedToContactPayload produces valid payload", () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Jane Smith
N:Smith;Jane;;;
EMAIL:jane@test.com
END:VCARD`;
    const parsed = parseVCardFile(vcf);
    const payload = parsedToContactPayload(parsed[0]!);
    expect(payload.display_name).toBe("Jane Smith");
    expect(payload.first_name).toBe("Jane");
    expect(payload.last_name).toBe("Smith");
    expect(payload.emails?.[0]?.email).toBe("jane@test.com");
  });
});

describe("vCard export round-trip", () => {
  test("contactToVCard4 produces valid vCard 4.0", () => {
    const contact = {
      id: "test-1",
      type: ContactType.Person,
      status: ContactStatus.Active,
      display_name: "Test User",
      first_name: "Test",
      last_name: "User",
      organization_name: null,
      notes: null,
      how_we_know_them: null,
      ok_to_email: ConsentStatus.Yes,
      ok_to_mail: ConsentStatus.Yes,
      ok_to_sms: ConsentStatus.Unknown,
      do_not_contact: false,
      club_name: null,
      role: null,
      uid: "test-1@badger",
      emails: [
        {
          id: "e1",
          contact_id: "c1",
          email: "test@example.com",
          type: "work" as const,
          is_primary: true,
        },
      ],
      phones: [],
      addresses: [
        {
          id: "a1",
          contact_id: "c1",
          address_line1: "456 Oak Ave",
          address_line2: null,
          city: "Madison",
          state: "WI",
          postal_code: "53703",
          country: "US",
          type: "home" as const,
          is_primary_mailing: true,
        },
      ],
      tags: [],
    };
    const vcf = contactToVCard4(contact);
    expect(vcf).toContain("BEGIN:VCARD");
    expect(vcf).toContain("VERSION:4.0");
    expect(vcf).toContain("FN:Test User");
    expect(vcf).toContain("test@example.com");
    expect(vcf).toContain("456 Oak Ave");
    expect(vcf).toContain("END:VCARD");
  });

  test("round-trip: parse then export", () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Round Trip Test
N:Test;Round;Trip;;;
EMAIL:round@trip.com
END:VCARD`;
    const parsed = parseVCardFile(vcf);
    const payload = parsedToContactPayload(parsed[0]!);
    const contact = {
      ...payload,
      id: "rt-1",
      type: ContactType.Person,
      uid: "rt-1@badger",
      status: ContactStatus.Active,
      how_we_know_them: null,
      ok_to_email: ConsentStatus.Unknown,
      ok_to_mail: ConsentStatus.Unknown,
      ok_to_sms: ConsentStatus.Unknown,
      do_not_contact: false,
      club_name: null,
      role: null,
      emails: (payload.emails ?? []) as Contact["emails"],
      phones: (payload.phones ?? []) as Contact["phones"],
      addresses: (payload.addresses ?? []) as Contact["addresses"],
      tags: (payload.tags ?? []) as Contact["tags"],
    };
    const exported = contactToVCard4(contact as Contact);
    expect(exported).toContain("Round Trip Test");
    expect(exported).toContain("round@trip.com");
  });
});
