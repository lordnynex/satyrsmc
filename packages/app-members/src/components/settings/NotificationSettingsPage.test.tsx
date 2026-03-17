import { describe, test, expect } from "bun:test";
import { waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { NotificationSettingsPage } from "./NotificationSettingsPage";

function getScreen() {
  return within(document.body);
}

describe("NotificationSettingsPage", () => {
  const preferencesData = {
    mailing_lists: [
      {
        list_id: "list-1",
        name: "Club Newsletter",
        description: "Monthly club updates and news",
        unsubscribed: false,
      },
      {
        list_id: "list-2",
        name: "Event Announcements",
        description: null,
        unsubscribed: true,
      },
    ],
  };

  test("renders Email Notifications section", async () => {
    renderWithProviders(<NotificationSettingsPage />, {
      handlers: {
        "members.notifications.getPreferences": () => preferencesData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Email Notifications")).not.toBeNull();
      expect(getScreen().getByText("Public Newsletter")).not.toBeNull();
      expect(getScreen().getByText("Members Newsletter")).not.toBeNull();
    });
  });

  test("renders coming soon note", async () => {
    renderWithProviders(<NotificationSettingsPage />, {
      handlers: {
        "members.notifications.getPreferences": () => preferencesData,
      },
    });

    await waitFor(() => {
      expect(
        getScreen().getByText("Notification preferences will be available soon."),
      ).not.toBeNull();
    });
  });

  test("renders Mailing List Subscriptions section", async () => {
    renderWithProviders(<NotificationSettingsPage />, {
      handlers: {
        "members.notifications.getPreferences": () => preferencesData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Mailing List Subscriptions")).not.toBeNull();
      expect(getScreen().getByText("Club Newsletter")).not.toBeNull();
      expect(getScreen().getByText("Monthly club updates and news")).not.toBeNull();
      expect(getScreen().getByText("Event Announcements")).not.toBeNull();
    });
  });

  test("renders toggle switches for mailing lists", async () => {
    renderWithProviders(<NotificationSettingsPage />, {
      handlers: {
        "members.notifications.getPreferences": () => preferencesData,
      },
    });

    await waitFor(() => {
      const switches = getScreen().getAllByRole("switch");
      // 2 disabled email notification switches + 2 mailing list switches
      expect(switches.length).toBe(4);
    });
  });

  test("mailing list switches reflect subscription state", async () => {
    renderWithProviders(<NotificationSettingsPage />, {
      handlers: {
        "members.notifications.getPreferences": () => preferencesData,
      },
    });

    await waitFor(() => {
      // Club Newsletter is subscribed (checked), Event Announcements is unsubscribed (unchecked)
      const clubSwitch = getScreen().getByLabelText("Club Newsletter");
      const eventSwitch = getScreen().getByLabelText("Event Announcements");
      expect(clubSwitch.getAttribute("aria-checked")).toBe("true");
      expect(eventSwitch.getAttribute("aria-checked")).toBe("false");
    });
  });

  test("shows empty message when no mailing lists", async () => {
    renderWithProviders(<NotificationSettingsPage />, {
      handlers: {
        "members.notifications.getPreferences": () => ({ mailing_lists: [] }),
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("You are not currently on any mailing lists.")).not.toBeNull();
    });
  });

  test("email notification switches are disabled", async () => {
    renderWithProviders(<NotificationSettingsPage />, {
      handlers: {
        "members.notifications.getPreferences": () => preferencesData,
      },
    });

    await waitFor(() => {
      const publicSwitch = getScreen().getByLabelText("Public Newsletter");
      const membersSwitch = getScreen().getByLabelText("Members Newsletter");
      expect(publicSwitch.getAttribute("disabled")).not.toBeNull();
      expect(membersSwitch.getAttribute("disabled")).not.toBeNull();
    });
  });
});
