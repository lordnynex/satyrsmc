import { describe, test, expect } from "vitest";
import { waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { AccountSettingsPage } from "./AccountSettingsPage";

function getScreen() {
  return within(document.body);
}

describe("AccountSettingsPage", () => {
  const accountData = {
    username: "testuser",
    user_type: "user",
    user_status: "active",
    email: "test@example.com",
    created_at: "2025-01-15T12:00:00.000Z",
  };

  test("renders account status card", async () => {
    renderWithProviders(<AccountSettingsPage />, {
      handlers: {
        "members.settings.getAccount": () => accountData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("testuser")).not.toBeNull();
      expect(getScreen().getByText("active")).not.toBeNull();
      expect(getScreen().getByText("test@example.com")).not.toBeNull();
    });
  });

  test("renders change password form", async () => {
    renderWithProviders(<AccountSettingsPage />, {
      handlers: {
        "members.settings.getAccount": () => accountData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Current Password")).not.toBeNull();
      expect(getScreen().getByText("New Password")).not.toBeNull();
      expect(getScreen().getByText("Confirm New Password")).not.toBeNull();
    });
  });

  test("renders change email form", async () => {
    renderWithProviders(<AccountSettingsPage />, {
      handlers: {
        "members.settings.getAccount": () => accountData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("New Email")).not.toBeNull();
      // The form contains both a card title "Change Email" and a button "Change Email"
      expect(getScreen().getAllByText("Change Email").length).toBeGreaterThanOrEqual(1);
    });
  });

  test("renders Coming Soon dues placeholder", async () => {
    renderWithProviders(<AccountSettingsPage />, {
      handlers: {
        "members.settings.getAccount": () => accountData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Dues & Payments")).not.toBeNull();
      expect(getScreen().getByText("Coming Soon")).not.toBeNull();
    });
  });
});
