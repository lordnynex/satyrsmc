import { describe, test, expect } from "bun:test";
import { waitFor, within } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, TrpcClientProvider } from "@satyrsmc/shared/client";
import { createMockTrpcLink } from "@/test/createMockTrpcLink";
import { MemberProfilePage } from "./MemberProfilePage";

function getScreen() {
  return within(document.body);
}

type MockHandler = (input: unknown) => unknown;

function renderProfilePage(path: string, handlers: Record<string, MockHandler> = {}) {
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
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/roster/:username" element={<MemberProfilePage />} />
            </Routes>
          </MemoryRouter>
        </TrpcClientProvider>
      </QueryClientProvider>
    </trpc.Provider>,
  );
}

describe("MemberProfilePage", () => {
  const profileData = {
    id: "user-1",
    username: "johndoe",
    display_name: "John Doe",
    first_name: "John",
    last_name: "Doe",
    position: "President",
    member_since: "2020-01-01T12:00:00.000Z",
    birthday: "1990-06-15T12:00:00.000Z",
    city: "Los Angeles",
    state: "CA",
    is_own_profile: true,
    has_photo: false,
    photo_url: null,
    photo_thumbnail_url: null,
    bikes: [
      {
        id: "bike-1",
        year: 2021,
        make: "Harley-Davidson",
        model: "Road King",
        trim: null,
        mods: null,
        has_photo: false,
        is_primary: true,
      },
    ],
  };

  test("renders profile data", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => profileData,
    });

    await waitFor(() => {
      expect(getScreen().getByText("John Doe")).not.toBeNull();
      expect(getScreen().getByText("President")).not.toBeNull();
    });
  });

  test("shows edit button when is_own_profile", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => profileData,
    });

    await waitFor(() => {
      expect(getScreen().getByText("Edit Profile")).not.toBeNull();
    });
  });

  test("hides edit button when not own profile", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => ({ ...profileData, is_own_profile: false }),
    });

    await waitFor(() => {
      expect(getScreen().getByText("John Doe")).not.toBeNull();
      expect(getScreen().queryByText("Edit Profile")).toBeNull();
    });
  });
});
