import { describe, test, expect } from "vitest";
import { waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { UsersPanel } from "./UsersPanel";

function getScreen() {
  return within(document.body);
}

describe("UsersPanel", () => {
  const mockUsers = {
    users: [
      {
        id: "1",
        username: "admin",
        display_name: "Admin User",
        email: "admin@test.com",
        user_type: "admin",
        user_status: "active",
        member_id: null,
      },
    ],
    total: 1,
  };

  function createHandlers(callTracker?: { count: number }) {
    return {
      "admin.users.list": () => {
        if (callTracker) callTracker.count++;
        return mockUsers;
      },
      "admin.users.pendingCount": () => ({ locked_count: 0, registration_count: 0 }),
      "admin.users.listRegistrations": () => [],
    };
  }

  test("renders user list", async () => {
    renderWithProviders(<UsersPanel />, {
      handlers: createHandlers(),
      initialEntries: ["/users"],
    });

    await waitFor(() => {
      expect(getScreen().getByText("User Accounts")).not.toBeNull();
      expect(getScreen().getByText("admin")).not.toBeNull();
    });
  });

  test("search input updates immediately", async () => {
    renderWithProviders(<UsersPanel />, {
      handlers: createHandlers(),
      initialEntries: ["/users"],
    });

    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    const input = getScreen().getByPlaceholderText("Search users...");
    await user.type(input, "test");

    // Input value updates immediately
    expect((input as HTMLInputElement).value).toBe("test");
  });

  test("debounces search query", async () => {
    const tracker = { count: 0 };
    renderWithProviders(<UsersPanel />, {
      handlers: createHandlers(tracker),
      initialEntries: ["/users"],
    });

    // Wait for initial query to fire
    await waitFor(() => {
      expect(tracker.count).toBeGreaterThan(0);
    });

    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    const input = getScreen().getByPlaceholderText("Search users...");

    // Type rapidly — should not fire query for each keystroke
    await user.type(input, "test");

    // Immediately after typing, count should not have increased much
    // (debounce prevents immediate refetch)
    const countAfterTyping = tracker.count;

    // Wait for debounce to settle (300ms + buffer)
    await new Promise((resolve) => setTimeout(resolve, 400));

    // After debounce, one more query should have fired
    await waitFor(() => {
      expect(tracker.count).toBeGreaterThan(countAfterTyping);
    });
  });
});
