import { describe, test, expect } from "vitest";
import {
  ToggleMailingListInputSchema,
  NotificationPreferencesOutputSchema,
} from "../notifications";

describe("ToggleMailingListInputSchema", () => {
  test("requires list_id and unsubscribed", () => {
    const result = ToggleMailingListInputSchema.safeParse({});
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path[0]);
    expect(paths).toContain("list_id");
    expect(paths).toContain("unsubscribed");
  });

  test("rejects empty list_id", () => {
    const result = ToggleMailingListInputSchema.safeParse({
      list_id: "",
      unsubscribed: true,
    });
    expect(result.success).toBe(false);
  });

  test("accepts valid input to unsubscribe", () => {
    const result = ToggleMailingListInputSchema.safeParse({
      list_id: "list-123",
      unsubscribed: true,
    });
    expect(result.success).toBe(true);
  });

  test("accepts valid input to resubscribe", () => {
    const result = ToggleMailingListInputSchema.safeParse({
      list_id: "list-123",
      unsubscribed: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("NotificationPreferencesOutputSchema", () => {
  test("accepts valid output with mailing lists", () => {
    const result = NotificationPreferencesOutputSchema.safeParse({
      mailing_lists: [
        {
          list_id: "list-1",
          name: "Newsletter",
          description: "Weekly updates",
          unsubscribed: false,
        },
        {
          list_id: "list-2",
          name: "Announcements",
          description: null,
          unsubscribed: true,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("accepts empty mailing lists array", () => {
    const result = NotificationPreferencesOutputSchema.safeParse({
      mailing_lists: [],
    });
    expect(result.success).toBe(true);
  });

  test("rejects missing mailing_lists", () => {
    const result = NotificationPreferencesOutputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
