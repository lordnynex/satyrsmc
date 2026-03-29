import { describe, test, expect } from "vitest";
import { ChangePasswordInputSchema, ChangeEmailInputSchema } from "../settings";

describe("ChangePasswordInputSchema", () => {
  test("validates password requirements", () => {
    const valid = ChangePasswordInputSchema.safeParse({
      current_password: "OldPass1!",
      new_password: "TestPass1!",
      confirm_password: "TestPass1!",
    });
    expect(valid.success).toBe(true);

    const weak = ChangePasswordInputSchema.safeParse({
      current_password: "OldPass1!",
      new_password: "weak",
      confirm_password: "weak",
    });
    expect(weak.success).toBe(false);
    expect(weak.error!.issues.length).toBeGreaterThan(0);
  });

  test("requires confirm to match new_password", () => {
    const result = ChangePasswordInputSchema.safeParse({
      current_password: "OldPass1!",
      new_password: "TestPass1!",
      confirm_password: "Different1!",
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (i) => i.path.includes("confirm_password") && /match/i.test(i.message),
      ),
    ).toBe(true);
  });
});

describe("ChangeEmailInputSchema", () => {
  test("validates email format", () => {
    const invalid = ChangeEmailInputSchema.safeParse({
      new_email: "not-an-email",
      password: "SomePass1!",
    });
    expect(invalid.success).toBe(false);
    expect(invalid.error?.issues.some((i) => i.path.includes("new_email"))).toBe(true);

    const valid = ChangeEmailInputSchema.safeParse({
      new_email: "user@example.com",
      password: "SomePass1!",
    });
    expect(valid.success).toBe(true);
  });

  test("requires password", () => {
    const result = ChangeEmailInputSchema.safeParse({
      new_email: "user@example.com",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("password"))).toBe(true);
  });
});
