import { describe, test, expect } from "vitest";
import { ProfileSettingsUpdateInputSchema, MemberProfileGetInputSchema } from "../profile";

describe("MemberProfileGetInputSchema", () => {
  test("requires username (fails on empty string)", () => {
    const result = MemberProfileGetInputSchema.safeParse({ username: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Username is required");
  });
});

describe("ProfileSettingsUpdateInputSchema", () => {
  test("validates required first_name and last_name", () => {
    const valid = ProfileSettingsUpdateInputSchema.safeParse({
      first_name: "John",
      last_name: "Doe",
    });
    expect(valid.success).toBe(true);

    const missingFirst = ProfileSettingsUpdateInputSchema.safeParse({
      last_name: "Doe",
    });
    expect(missingFirst.success).toBe(false);

    const missingLast = ProfileSettingsUpdateInputSchema.safeParse({
      first_name: "John",
    });
    expect(missingLast.success).toBe(false);
  });

  test("accepts optional phones, addresses, emergency_contacts", () => {
    const result = ProfileSettingsUpdateInputSchema.safeParse({
      first_name: "John",
      last_name: "Doe",
      phones: [{ phone: "555-1234", type: "mobile", is_primary: true }],
      addresses: [{ country: "US", type: "home", is_primary_mailing: true }],
      emergency_contacts: [{ name: "Jane", phone: "555-5678" }],
    });
    expect(result.success).toBe(true);
  });

  test("rejects first_name longer than 50 chars", () => {
    const result = ProfileSettingsUpdateInputSchema.safeParse({
      first_name: "A".repeat(51),
      last_name: "Doe",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("first_name"))).toBe(true);
  });
});
