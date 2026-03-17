import { describe, test, expect } from "bun:test";
import { waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { GarageSettingsPage } from "./GarageSettingsPage";

function getScreen() {
  return within(document.body);
}

describe("GarageSettingsPage", () => {
  const bikesData = {
    items: [
      {
        id: "bike-1",
        year: 2021,
        make: "Harley-Davidson",
        model: "Road King",
        trim: "Special",
        mods: "Stage 1 exhaust",
        has_photo: false,
        is_primary: true,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "bike-2",
        year: 2020,
        make: "Honda",
        model: "Rebel 500",
        trim: null,
        mods: null,
        has_photo: false,
        is_primary: false,
        created_at: "2025-02-01T00:00:00.000Z",
        updated_at: "2025-02-01T00:00:00.000Z",
      },
    ],
  };

  test("renders bike cards from query data", async () => {
    renderWithProviders(<GarageSettingsPage />, {
      handlers: {
        "members.bikes.list": () => bikesData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("2021 Harley-Davidson Road King")).not.toBeNull();
      expect(getScreen().getByText("2020 Honda Rebel 500")).not.toBeNull();
    });
  });

  test("shows Add Bike button", async () => {
    renderWithProviders(<GarageSettingsPage />, {
      handlers: {
        "members.bikes.list": () => bikesData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Add Bike")).not.toBeNull();
    });
  });

  test("shows primary badge on primary bike", async () => {
    renderWithProviders(<GarageSettingsPage />, {
      handlers: {
        "members.bikes.list": () => bikesData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Primary")).not.toBeNull();
    });
  });

  test("shows Set Primary on non-primary bikes", async () => {
    renderWithProviders(<GarageSettingsPage />, {
      handlers: {
        "members.bikes.list": () => bikesData,
      },
    });

    await waitFor(() => {
      expect(getScreen().getByText("Set Primary")).not.toBeNull();
    });
  });

  test("shows Add Photo buttons when bikes have no photos", async () => {
    renderWithProviders(<GarageSettingsPage />, {
      handlers: {
        "members.bikes.list": () => bikesData,
      },
    });

    await waitFor(() => {
      const addPhotoButtons = getScreen().getAllByText("Add Photo");
      expect(addPhotoButtons.length).toBe(2);
    });
  });

  test("shows empty state when no bikes", async () => {
    renderWithProviders(<GarageSettingsPage />, {
      handlers: {
        "members.bikes.list": () => ({ items: [] }),
      },
    });

    await waitFor(() => {
      expect(
        getScreen().getByText("No bikes in your garage yet. Add one to get started."),
      ).not.toBeNull();
    });
  });
});
