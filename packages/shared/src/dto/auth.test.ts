import { describe, it, expect } from "bun:test";
import {
  passwordSchema,
  usernameSchema,
  RegisterInputSchema,
  ValidateTokenInputSchema,
  SignupInputSchema,
  LoginInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
} from "./auth";

describe("passwordSchema", () => {
  it("accepts a valid password", () => {
    expect(passwordSchema.safeParse("Abcdef1!").success).toBe(true);
  });

  it("rejects password shorter than 8 chars", () => {
    expect(passwordSchema.safeParse("Ab1!xyz").success).toBe(false);
  });

  it("rejects password longer than 128 chars", () => {
    const long = "A".repeat(120) + "bcdef1!x" + "z".repeat(10);
    expect(passwordSchema.safeParse(long).success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    expect(passwordSchema.safeParse("abcdef1!").success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    expect(passwordSchema.safeParse("ABCDEF1!").success).toBe(false);
  });

  it("rejects password without number", () => {
    expect(passwordSchema.safeParse("Abcdefg!").success).toBe(false);
  });

  it("rejects password without special character", () => {
    expect(passwordSchema.safeParse("Abcdef12").success).toBe(false);
  });

  it("accepts a strong password with mixed chars", () => {
    expect(passwordSchema.safeParse("MyP@ssw0rd!").success).toBe(true);
  });

  it("accepts password at exactly 8 chars", () => {
    expect(passwordSchema.safeParse("Aa1!xxxx").success).toBe(true);
  });

  it("accepts password at exactly 128 chars", () => {
    const pwd = "Aa1!" + "x".repeat(124);
    expect(passwordSchema.safeParse(pwd).success).toBe(true);
  });
});

describe("usernameSchema", () => {
  it("accepts a valid username", () => {
    expect(usernameSchema.safeParse("john.doe").success).toBe(true);
  });

  it("accepts alphanumeric username", () => {
    expect(usernameSchema.safeParse("user123").success).toBe(true);
  });

  it("accepts username with hyphens", () => {
    expect(usernameSchema.safeParse("john-doe").success).toBe(true);
  });

  it("rejects username shorter than 3 chars", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
  });

  it("rejects username longer than 30 chars", () => {
    expect(usernameSchema.safeParse("a".repeat(31)).success).toBe(false);
  });

  it("rejects username starting with a number", () => {
    expect(usernameSchema.safeParse("1username").success).toBe(false);
  });

  it("rejects username starting with a dot", () => {
    expect(usernameSchema.safeParse(".username").success).toBe(false);
  });

  it("rejects username with consecutive dots", () => {
    expect(usernameSchema.safeParse("john..doe").success).toBe(false);
  });

  it("rejects username with consecutive hyphens", () => {
    expect(usernameSchema.safeParse("john--doe").success).toBe(false);
  });

  it("rejects username with special characters", () => {
    expect(usernameSchema.safeParse("john@doe").success).toBe(false);
  });

  it("accepts username at exactly 3 chars", () => {
    expect(usernameSchema.safeParse("abc").success).toBe(true);
  });

  it("accepts username at exactly 30 chars", () => {
    expect(usernameSchema.safeParse("a".repeat(30)).success).toBe(true);
  });
});

describe("RegisterInputSchema", () => {
  const validInput = {
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    recaptcha_token: "valid-token",
  };

  it("accepts valid registration input", () => {
    expect(RegisterInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(RegisterInputSchema.safeParse({ ...validInput, email: "not-email" }).success).toBe(
      false,
    );
  });

  it("rejects empty first name", () => {
    expect(RegisterInputSchema.safeParse({ ...validInput, first_name: "" }).success).toBe(false);
  });

  it("rejects empty last name", () => {
    expect(RegisterInputSchema.safeParse({ ...validInput, last_name: "" }).success).toBe(false);
  });

  it("rejects empty recaptcha token", () => {
    expect(RegisterInputSchema.safeParse({ ...validInput, recaptcha_token: "" }).success).toBe(
      false,
    );
  });

  it("rejects missing fields", () => {
    expect(RegisterInputSchema.safeParse({}).success).toBe(false);
  });
});

describe("ValidateTokenInputSchema", () => {
  it("accepts valid token", () => {
    expect(ValidateTokenInputSchema.safeParse({ token: "abc123" }).success).toBe(true);
  });

  it("rejects empty token", () => {
    expect(ValidateTokenInputSchema.safeParse({ token: "" }).success).toBe(false);
  });
});

describe("SignupInputSchema", () => {
  const validInput = {
    token: "valid-token",
    username: "johndoe",
    password: "MyP@ssw0rd",
    password_confirm: "MyP@ssw0rd",
    birthday: "1990-01-01",
  };

  it("accepts valid signup input", () => {
    expect(SignupInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = SignupInputSchema.safeParse({
      ...validInput,
      password_confirm: "Different1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects birthday under 18", () => {
    const recentDate = new Date();
    recentDate.setFullYear(recentDate.getFullYear() - 17);
    const result = SignupInputSchema.safeParse({
      ...validInput,
      birthday: recentDate.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it("accepts birthday exactly 18 years ago", () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    const result = SignupInputSchema.safeParse({
      ...validInput,
      birthday: date.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(true);
  });

  it("rejects weak password in signup", () => {
    const result = SignupInputSchema.safeParse({
      ...validInput,
      password: "weak",
      password_confirm: "weak",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid username in signup", () => {
    const result = SignupInputSchema.safeParse({
      ...validInput,
      username: "1x",
    });
    expect(result.success).toBe(false);
  });
});

describe("LoginInputSchema", () => {
  it("accepts valid login input", () => {
    const result = LoginInputSchema.safeParse({
      username: "johndoe",
      password: "password",
      recaptcha_token: "token",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = LoginInputSchema.safeParse({
      username: "",
      password: "password",
      recaptcha_token: "token",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = LoginInputSchema.safeParse({
      username: "johndoe",
      password: "",
      recaptcha_token: "token",
    });
    expect(result.success).toBe(false);
  });
});

describe("ForgotPasswordInputSchema", () => {
  it("accepts valid email", () => {
    expect(ForgotPasswordInputSchema.safeParse({ email: "test@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(ForgotPasswordInputSchema.safeParse({ email: "not-email" }).success).toBe(false);
  });
});

describe("ResetPasswordInputSchema", () => {
  it("accepts valid reset input", () => {
    const result = ResetPasswordInputSchema.safeParse({
      token: "valid-token",
      password: "NewP@ssw0rd",
      password_confirm: "NewP@ssw0rd",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = ResetPasswordInputSchema.safeParse({
      token: "valid-token",
      password: "NewP@ssw0rd",
      password_confirm: "Different1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password", () => {
    const result = ResetPasswordInputSchema.safeParse({
      token: "valid-token",
      password: "weak",
      password_confirm: "weak",
    });
    expect(result.success).toBe(false);
  });
});
