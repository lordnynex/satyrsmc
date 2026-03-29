import { describe, it, expect } from "vitest";
import type { PstContactLike } from "./pst";
import { pstContactToPayload } from "./pst";

describe("pstContactToPayload", () => {
  it("maps a fully populated contact", () => {
    const contact: PstContactLike = {
      givenName: "John",
      surname: "Doe",
      displayName: "John Doe",
      companyName: "Acme Corp",
      title: "Engineer",
      note: "Met at conference",
      email1EmailAddress: "john@work.com",
      email2EmailAddress: "john@home.com",
      email3EmailAddress: "john@other.com",
      businessTelephoneNumber: "555-0100",
      homeTelephoneNumber: "555-0101",
      mobileTelephoneNumber: "555-0102",
      primaryTelephoneNumber: "555-0103",
      businessAddressStreet: "100 Main St",
      businessAddressCity: "Springfield",
      businessAddressStateOrProvince: "IL",
      businessPostalCode: "62701",
      businessAddressCountry: "US",
      homeAddressStreet: "200 Oak Ave",
      homeAddressCity: "Shelbyville",
      homeAddressStateOrProvince: "IL",
      homeAddressPostalCode: "62565",
      homeAddressCountry: "US",
    };

    const result = pstContactToPayload(contact);

    expect(result.display_name).toBe("John Doe");
    expect(result.first_name).toBe("John");
    expect(result.last_name).toBe("Doe");
    expect(result.organization_name).toBe("Acme Corp");
    expect(result.role).toBe("Engineer");
    expect(result.notes).toBe("Met at conference");
    expect(result.type).toBe("person");

    // Emails
    expect(result.emails).toHaveLength(3);
    expect(result.emails![0]).toMatchObject({
      email: "john@work.com",
      type: "work",
      is_primary: true,
    });
    expect(result.emails![1]).toMatchObject({
      email: "john@home.com",
      type: "home",
      is_primary: false,
    });
    expect(result.emails![2]).toMatchObject({
      email: "john@other.com",
      type: "other",
      is_primary: false,
    });

    // Phones
    expect(result.phones).toHaveLength(4);
    expect(result.phones![0]).toMatchObject({
      phone: "555-0100",
      type: "work",
      is_primary: true,
    });
    expect(result.phones![1]).toMatchObject({
      phone: "555-0101",
      type: "home",
      is_primary: false,
    });
    expect(result.phones![2]).toMatchObject({
      phone: "555-0102",
      type: "cell",
      is_primary: false,
    });
    expect(result.phones![3]).toMatchObject({
      phone: "555-0103",
      type: "other",
      is_primary: false,
    });

    // Addresses — different business and home, both present
    expect(result.addresses).toHaveLength(2);
    expect(result.addresses![0]).toMatchObject({
      address_line1: "100 Main St",
      city: "Springfield",
      state: "IL",
      postal_code: "62701",
      country: "US",
      type: "work",
      is_primary_mailing: true,
    });
    expect(result.addresses![1]).toMatchObject({
      address_line1: "200 Oak Ave",
      city: "Shelbyville",
      state: "IL",
      postal_code: "62565",
      country: "US",
      type: "home",
      is_primary_mailing: false,
    });
  });

  it("handles a minimal contact with only displayName", () => {
    const contact: PstContactLike = {
      displayName: "Jane Smith",
    };

    const result = pstContactToPayload(contact);

    expect(result.display_name).toBe("Jane Smith");
    expect(result.first_name).toBeNull();
    expect(result.last_name).toBeNull();
    expect(result.organization_name).toBeNull();
    expect(result.role).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.type).toBe("person");
    expect(result.emails).toHaveLength(0);
    expect(result.phones).toHaveLength(0);
    expect(result.addresses).toHaveLength(0);
  });

  it("falls back to given + surname when displayName is missing", () => {
    const contact: PstContactLike = {
      givenName: "Alice",
      surname: "Johnson",
    };

    const result = pstContactToPayload(contact);

    expect(result.display_name).toBe("Alice Johnson");
    expect(result.first_name).toBe("Alice");
    expect(result.last_name).toBe("Johnson");
  });

  it("falls back to company name when no personal name is available", () => {
    const contact: PstContactLike = {
      companyName: "Widgets Inc",
    };

    const result = pstContactToPayload(contact);

    expect(result.display_name).toBe("Widgets Inc");
    expect(result.type).toBe("organization");
    expect(result.organization_name).toBe("Widgets Inc");
  });

  it('falls back to "Unknown" when no name fields are present', () => {
    const contact: PstContactLike = {};

    const result = pstContactToPayload(contact);

    expect(result.display_name).toBe("Unknown");
  });

  it("produces empty email array when no emails provided", () => {
    const contact: PstContactLike = {
      displayName: "No Email Person",
    };

    const result = pstContactToPayload(contact);

    expect(result.emails).toEqual([]);
  });

  it("skips blank email addresses", () => {
    const contact: PstContactLike = {
      displayName: "Partial Email",
      email1EmailAddress: "valid@example.com",
      email2EmailAddress: "  ",
      email3EmailAddress: "",
    };

    const result = pstContactToPayload(contact);

    expect(result.emails).toHaveLength(1);
    expect(result.emails![0].email).toBe("valid@example.com");
    expect(result.emails![0].is_primary).toBe(true);
  });

  it("produces empty phone array when no phones provided", () => {
    const contact: PstContactLike = {
      displayName: "No Phone Person",
    };

    const result = pstContactToPayload(contact);

    expect(result.phones).toEqual([]);
  });

  it("strips whitespace from phone numbers", () => {
    const contact: PstContactLike = {
      displayName: "Phone Test",
      businessTelephoneNumber: " 555 123 4567 ",
    };

    const result = pstContactToPayload(contact);

    expect(result.phones).toHaveLength(1);
    expect(result.phones![0].phone).toBe("5551234567");
  });

  it("deduplicates identical business and home addresses", () => {
    const contact: PstContactLike = {
      displayName: "Dedup Test",
      businessAddressStreet: "123 Main St",
      businessAddressCity: "Springfield",
      businessAddressStateOrProvince: "IL",
      businessPostalCode: "62701",
      businessAddressCountry: "US",
      homeAddressStreet: "123 Main St",
      homeAddressCity: "Springfield",
      homeAddressStateOrProvince: "IL",
      homeAddressPostalCode: "62701",
      homeAddressCountry: "US",
    };

    const result = pstContactToPayload(contact);

    // Should produce a single "home" address, not both
    expect(result.addresses).toHaveLength(1);
    expect(result.addresses![0].type).toBe("home");
    expect(result.addresses![0].is_primary_mailing).toBe(true);
    expect(result.addresses![0].address_line1).toBe("123 Main St");
  });

  it("deduplicates addresses with different casing and whitespace", () => {
    const contact: PstContactLike = {
      displayName: "Fuzzy Dedup Test",
      businessAddressStreet: "  123 MAIN ST  ",
      businessAddressCity: " Springfield ",
      businessPostalCode: "62701",
      homeAddressStreet: "123 Main St",
      homeAddressCity: "Springfield",
      homeAddressPostalCode: "62701",
    };

    const result = pstContactToPayload(contact);

    expect(result.addresses).toHaveLength(1);
    expect(result.addresses![0].type).toBe("home");
  });

  it("falls back to postalAddress when no structured address is present", () => {
    const contact: PstContactLike = {
      displayName: "Postal Only",
      postalAddress: "PO Box 42, Anywhere USA",
    };

    const result = pstContactToPayload(contact);

    expect(result.addresses).toHaveLength(1);
    expect(result.addresses![0]).toMatchObject({
      address_line1: "PO Box 42, Anywhere USA",
      city: null,
      state: null,
      postal_code: null,
      country: "US",
      type: "postal",
      is_primary_mailing: true,
    });
  });

  it("does not use postalAddress fallback when structured address exists", () => {
    const contact: PstContactLike = {
      displayName: "Has Both",
      homeAddressStreet: "456 Elm St",
      homeAddressCity: "Gotham",
      homeAddressPostalCode: "10001",
      postalAddress: "PO Box 99",
    };

    const result = pstContactToPayload(contact);

    expect(result.addresses).toHaveLength(1);
    expect(result.addresses![0].type).toBe("home");
    expect(result.addresses![0].address_line1).toBe("456 Elm St");
  });

  it("defaults country to US when not specified", () => {
    const contact: PstContactLike = {
      displayName: "No Country",
      businessAddressStreet: "789 Broadway",
      businessAddressCity: "New York",
      businessPostalCode: "10003",
    };

    const result = pstContactToPayload(contact);

    expect(result.addresses![0].country).toBe("US");
  });

  it("uses provided country when specified", () => {
    const contact: PstContactLike = {
      displayName: "International",
      homeAddressStreet: "10 Downing St",
      homeAddressCity: "London",
      homeAddressPostalCode: "SW1A 2AA",
      homeAddressCountry: "UK",
    };

    const result = pstContactToPayload(contact);

    expect(result.addresses![0].country).toBe("UK");
  });

  it("marks first email as primary", () => {
    const contact: PstContactLike = {
      displayName: "Primary Email",
      email2EmailAddress: "second@example.com",
      email3EmailAddress: "third@example.com",
    };

    const result = pstContactToPayload(contact);

    // email2 comes first since email1 is absent
    expect(result.emails).toHaveLength(2);
    expect(result.emails![0].email).toBe("second@example.com");
    expect(result.emails![0].is_primary).toBe(true);
    expect(result.emails![1].is_primary).toBe(false);
  });

  it("marks first phone as primary", () => {
    const contact: PstContactLike = {
      displayName: "Primary Phone",
      mobileTelephoneNumber: "555-0001",
      primaryTelephoneNumber: "555-0002",
    };

    const result = pstContactToPayload(contact);

    // mobile comes first since business/home are absent
    expect(result.phones).toHaveLength(2);
    expect(result.phones![0].phone).toBe("555-0001");
    expect(result.phones![0].is_primary).toBe(true);
    expect(result.phones![1].is_primary).toBe(false);
  });

  it("sets type to organization when only company name is present", () => {
    const contact: PstContactLike = {
      displayName: "Some LLC",
      companyName: "Some LLC",
    };

    const result = pstContactToPayload(contact);

    expect(result.type).toBe("organization");
  });

  it("sets type to person when both company and personal name are present", () => {
    const contact: PstContactLike = {
      givenName: "Bob",
      companyName: "Bob's Shop",
    };

    const result = pstContactToPayload(contact);

    expect(result.type).toBe("person");
  });

  it("trims whitespace from all string fields", () => {
    const contact: PstContactLike = {
      givenName: "  Alice  ",
      surname: "  Wonder  ",
      displayName: "  Alice Wonder  ",
      companyName: "  Wonderland Inc  ",
      title: "  CEO  ",
      note: "  Important  ",
    };

    const result = pstContactToPayload(contact);

    expect(result.display_name).toBe("Alice Wonder");
    expect(result.first_name).toBe("Alice");
    expect(result.last_name).toBe("Wonder");
    expect(result.organization_name).toBe("Wonderland Inc");
    expect(result.role).toBe("CEO");
    expect(result.notes).toBe("Important");
  });

  it("sets address_line2 to null", () => {
    const contact: PstContactLike = {
      displayName: "Line2 Test",
      homeAddressStreet: "99 Pine Rd",
      homeAddressCity: "Denver",
      homeAddressPostalCode: "80202",
    };

    const result = pstContactToPayload(contact);

    expect(result.addresses![0].address_line2).toBeNull();
  });
});
