import { describe, test, expect } from "vitest";
import { within, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import { UpcomingEvents } from "./UpcomingEvents";

describe("UpcomingEvents", () => {
  test("renders events when data is returned", async () => {
    const handlers = {
      "website.getEventsFeed": () => [
        {
          id: "e1",
          name: "Poker Run",
          description: null,
          year: 2026,
          start_date: "2026-06-15T19:00:00.000Z",
          event_url: null,
          event_location: "Los Angeles",
          event_type: "ride",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    };

    renderWithProviders(<UpcomingEvents />, { handlers });

    await waitFor(() => {
      const screen = within(document.body);
      expect(screen.getByText("Poker Run")).not.toBeNull();
    });
  });

  test("renders empty message when no events", async () => {
    const handlers = {
      "website.getEventsFeed": () => [],
    };

    renderWithProviders(<UpcomingEvents />, { handlers });

    await waitFor(() => {
      const screen = within(document.body);
      expect(screen.getByText(/no upcoming events/i)).not.toBeNull();
    });
  });

  test("renders heading", async () => {
    const handlers = {
      "website.getEventsFeed": () => [],
    };

    renderWithProviders(<UpcomingEvents />, { handlers });

    await waitFor(() => {
      const screen = within(document.body);
      expect(screen.getByText("Upcoming Events")).not.toBeNull();
    });
  });
});
