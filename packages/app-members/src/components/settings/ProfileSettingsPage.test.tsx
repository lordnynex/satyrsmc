import { describe, test, expect } from "vitest";
import { waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ProfileSettingsPage } from "./ProfileSettingsPage";

function getScreen() {
  return within(document.body);
}

describe("ProfileSettingsPage", () => {
  const settingsData = {
    first_name: "John",
    last_name: "Doe",
    birthday: "2000-06-15T12:00:00.000Z",
    has_photo: false,
    photo_url: null,
    phones: [{ id: "phone-1", phone: "5551234567", type: "cell", is_primary: true }],
    addresses: [],
    emergency_contacts: [],
  };

  test("renders form with loaded profile data", async () => {
    renderWithProviders(<ProfileSettingsPage />, {
      handlers: {
        "members.profile.getOwnSettings": () => settingsData,
      },
    });

    await waitFor(() => {
      const firstNameInput = getScreen().getByLabelText("First Name") as HTMLInputElement;
      expect(firstNameInput.value).toBe("John");

      const lastNameInput = getScreen().getByLabelText("Last Name") as HTMLInputElement;
      expect(lastNameInput.value).toBe("Doe");
    });
  });

  test("displays birthday as read-only", async () => {
    renderWithProviders(<ProfileSettingsPage />, {
      handlers: {
        "members.profile.getOwnSettings": () => settingsData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Birthday")).not.toBeNull();
      expect(
        getScreen().getByText("Contact an administrator to update your birthday."),
      ).not.toBeNull();
      expect(getScreen().getByText("June 15, 2000")).not.toBeNull();
    });
  });

  test("renders phone numbers section", async () => {
    renderWithProviders(<ProfileSettingsPage />, {
      handlers: {
        "members.profile.getOwnSettings": () => settingsData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Phone Numbers")).not.toBeNull();
    });
  });

  test("renders save button", async () => {
    renderWithProviders(<ProfileSettingsPage />, {
      handlers: {
        "members.profile.getOwnSettings": () => settingsData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Save Changes")).not.toBeNull();
    });
  });
});
