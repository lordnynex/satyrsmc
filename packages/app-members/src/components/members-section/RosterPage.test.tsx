import { describe, test, expect, afterEach } from "vitest";
import { waitFor, within, fireEvent, cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, TrpcClientProvider } from "@satyrsmc/shared/client";
import { createMockTrpcLink } from "@/test/createMockTrpcLink";
import { RosterPage } from "./RosterPage";

function getScreen() {
  return within(document.body);
}

type MockHandler = (input: unknown) => unknown;

const memberA = {
  id: "m1",
  display_name: "Alice Adams",
  first_name: "Alice",
  last_name: "Adams",
  username: "alice",
  position: "President",
  member_since: "2020-01-01T12:00:00.000Z",
  has_photo: false,
  photo_thumbnail_url: null,
  bike: {
    year: 2019,
    make: "Harley-Davidson",
    model: "Road King",
    trim: "Special",
    has_photo: false,
  },
  phone: "(555) 123-4567",
};

const memberB = {
  id: "m2",
  display_name: "Bob Baker",
  first_name: "Bob",
  last_name: "Baker",
  username: "bob",
  position: "Member",
  member_since: "2022-06-01T12:00:00.000Z",
  has_photo: false,
  photo_thumbnail_url: null,
  bike: { year: 2021, make: "Honda", model: "Rebel 500", trim: null, has_photo: false },
  phone: null,
};

const rosterData = {
  members: [memberA, memberB],
  summary: { total: 2, officers: 1, regular_members: 1 },
};

const filterOptions = {
  years_joined: [2022, 2020],
  bike_makes: ["Harley-Davidson", "Honda"],
  bike_models: ["Rebel 500", "Road King"],
};

function renderRosterPage(handlers: Record<string, MockHandler> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [createMockTrpcLink(handlers)],
  });

  return render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TrpcClientProvider client={trpcClient}>
          <MemoryRouter initialEntries={["/roster"]}>
            <Routes>
              <Route path="/roster" element={<RosterPage />} />
            </Routes>
          </MemoryRouter>
        </TrpcClientProvider>
      </QueryClientProvider>
    </trpc.Provider>,
  );
}

describe("RosterPage", () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem("satyrs_roster_view");
  });

  const defaultHandlers = {
    "members.roster.list": () => rosterData,
    "members.roster.getFilterOptions": () => filterOptions,
  };

  test("renders roster heading and member names", async () => {
    renderRosterPage(defaultHandlers);

    await waitFor(() => {
      expect(getScreen().getByRole("heading", { name: "Club Roster" })).not.toBeNull();
      expect(getScreen().getByText("Alice Adams")).not.toBeNull();
      expect(getScreen().getByText("Bob Baker")).not.toBeNull();
    });
  });

  test("renders summary counts", async () => {
    renderRosterPage(defaultHandlers);

    await waitFor(() => {
      expect(getScreen().getByText("Officers")).not.toBeNull();
      expect(getScreen().getByText("Members")).not.toBeNull();
      expect(getScreen().getByText("Total")).not.toBeNull();
    });
  });

  test("shows empty state when no members", async () => {
    renderRosterPage({
      "members.roster.list": () => ({
        members: [],
        summary: { total: 0, officers: 0, regular_members: 0 },
      }),
      "members.roster.getFilterOptions": () => filterOptions,
    });

    await waitFor(() => {
      expect(getScreen().getByText("No members found.")).not.toBeNull();
    });
  });

  test("can switch between card and list view", async () => {
    renderRosterPage(defaultHandlers);

    await waitFor(() => {
      expect(getScreen().getByText("Alice Adams")).not.toBeNull();
    });

    // Switch to list view
    const listButton = getScreen().getByLabelText("List view");
    fireEvent.click(listButton);

    await waitFor(() => {
      // In list view, a table should appear
      expect(document.querySelector("table")).not.toBeNull();
    });
  });

  test("renders bike info in card view", async () => {
    renderRosterPage(defaultHandlers);

    await waitFor(() => {
      expect(getScreen().getByText("Alice Adams")).not.toBeNull();
      // Bike label is composed as "year make model trim" in a single <p> element
      expect(getScreen().getByText("2019 Harley-Davidson Road King Special")).not.toBeNull();
    });
  });

  test("renders position badge for officers", async () => {
    renderRosterPage(defaultHandlers);

    await waitFor(() => {
      expect(getScreen().getByText("President")).not.toBeNull();
    });
  });
});
