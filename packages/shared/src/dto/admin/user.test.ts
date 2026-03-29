import { describe, it, expect } from "vitest";
import { UserType, UserStatus } from "../../lib/enums";
import {
  UserListInputSchema,
  UserGetInputSchema,
  UserUpdateStatusInputSchema,
  UserUpdateTypeInputSchema,
  UserLinkMemberInputSchema,
  UserLinkContactInputSchema,
  UserAddNoteInputSchema,
  UserCreateInvitationInputSchema,
} from "./user";

describe("UserListInputSchema", () => {
  it("accepts undefined (optional)", () => {
    expect(UserListInputSchema.safeParse(undefined).success).toBe(true);
  });

  it("accepts empty object", () => {
    expect(UserListInputSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid filters", () => {
    const result = UserListInputSchema.safeParse({
      status: UserStatus.Active,
      user_type: UserType.Admin,
      q: "search",
      limit: 25,
      offset: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = UserListInputSchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects limit below 1", () => {
    const result = UserListInputSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit above 100", () => {
    const result = UserListInputSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects negative offset", () => {
    const result = UserListInputSchema.safeParse({ offset: -1 });
    expect(result.success).toBe(false);
  });
});

describe("UserGetInputSchema", () => {
  it("accepts valid id", () => {
    expect(UserGetInputSchema.safeParse({ id: "abc123" }).success).toBe(true);
  });

  it("rejects missing id", () => {
    expect(UserGetInputSchema.safeParse({}).success).toBe(false);
  });
});

describe("UserUpdateStatusInputSchema", () => {
  it("accepts valid status update", () => {
    const result = UserUpdateStatusInputSchema.safeParse({
      id: "abc123",
      user_status: UserStatus.Active,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    for (const status of Object.values(UserStatus)) {
      const result = UserUpdateStatusInputSchema.safeParse({
        id: "abc123",
        user_status: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = UserUpdateStatusInputSchema.safeParse({
      id: "abc123",
      user_status: "bogus",
    });
    expect(result.success).toBe(false);
  });
});

describe("UserUpdateTypeInputSchema", () => {
  it("accepts valid type update", () => {
    const result = UserUpdateTypeInputSchema.safeParse({
      id: "abc123",
      user_type: UserType.Admin,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid types", () => {
    for (const type of Object.values(UserType)) {
      const result = UserUpdateTypeInputSchema.safeParse({
        id: "abc123",
        user_type: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid type", () => {
    const result = UserUpdateTypeInputSchema.safeParse({
      id: "abc123",
      user_type: "bogus",
    });
    expect(result.success).toBe(false);
  });
});

describe("UserLinkMemberInputSchema", () => {
  it("accepts linking to a member", () => {
    const result = UserLinkMemberInputSchema.safeParse({
      id: "user1",
      member_id: "member1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts unlinking (null member_id)", () => {
    const result = UserLinkMemberInputSchema.safeParse({
      id: "user1",
      member_id: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("UserLinkContactInputSchema", () => {
  it("accepts valid contact link", () => {
    const result = UserLinkContactInputSchema.safeParse({
      id: "user1",
      contact_id: "contact1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing contact_id", () => {
    const result = UserLinkContactInputSchema.safeParse({ id: "user1" });
    expect(result.success).toBe(false);
  });
});

describe("UserAddNoteInputSchema", () => {
  it("accepts valid note", () => {
    const result = UserAddNoteInputSchema.safeParse({
      id: "user1",
      admin_note: "This user needs review",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing note", () => {
    const result = UserAddNoteInputSchema.safeParse({ id: "user1" });
    expect(result.success).toBe(false);
  });
});

describe("UserCreateInvitationInputSchema", () => {
  it("accepts valid invitation with email only", () => {
    const result = UserCreateInvitationInputSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts invitation with all fields", () => {
    const result = UserCreateInvitationInputSchema.safeParse({
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
      contact_id: "contact1",
      member_id: "member1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = UserCreateInvitationInputSchema.safeParse({
      email: "not-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = UserCreateInvitationInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
