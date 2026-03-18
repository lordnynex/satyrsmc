import { describe, test, expect, afterEach } from "bun:test";
import { waitFor, within, cleanup } from "@testing-library/react";
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
  afterEach(cleanup);

  const profileData = {
    id: "user-1",
    username: "johndoe",
    display_name: "John Doe",
    first_name: "John",
    last_name: "Doe",
    position: "President",
    member_since: "2020-01-01T12:00:00.000Z",
    birthday: "1990-06-15T12:00:00.000Z",
    email: "john@example.com",
    phone: "(555) 123-4567",
    address: {
      line1: "123 Main St",
      line2: null,
      city: "Los Angeles",
      state: "CA",
      postal_code: "90001",
    },
    emergency_contacts: [{ name: "Jane Doe", phone: "(555) 987-6543", relationship: "Spouse" }],
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
      expect(getScreen().getByRole("heading", { name: "John Doe" })).not.toBeNull();
      expect(getScreen().getByText("President")).not.toBeNull();
      expect(getScreen().getByText("john@example.com")).not.toBeNull();
      expect(getScreen().getByText("(555) 123-4567")).not.toBeNull();
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
      expect(getScreen().getByRole("heading", { name: "John Doe" })).not.toBeNull();
      expect(getScreen().queryByText("Edit Profile")).toBeNull();
    });
  });

  test("shows emergency contacts on own profile", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => profileData,
    });

    await waitFor(() => {
      expect(getScreen().getByText("Emergency Contacts")).not.toBeNull();
      expect(getScreen().getByText("Jane Doe")).not.toBeNull();
      expect(getScreen().getByText("(555) 987-6543")).not.toBeNull();
    });
  });

  test("hides emergency contacts when not own profile", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => ({ ...profileData, is_own_profile: false }),
    });

    await waitFor(() => {
      expect(getScreen().getByRole("heading", { name: "John Doe" })).not.toBeNull();
      expect(getScreen().queryByText("Emergency Contacts")).toBeNull();
    });
  });

  test("hides emergency contacts section when array is empty", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => ({ ...profileData, emergency_contacts: [] }),
    });

    await waitFor(() => {
      expect(getScreen().getByRole("heading", { name: "John Doe" })).not.toBeNull();
      expect(getScreen().queryByText("Emergency Contacts")).toBeNull();
    });
  });

  test("renders address fields", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => profileData,
    });

    await waitFor(() => {
      expect(getScreen().getByText("123 Main St")).not.toBeNull();
      expect(getScreen().getByText(/Los Angeles, CA, 90001/)).not.toBeNull();
    });
  });

  test("renders member since date", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => profileData,
    });

    await waitFor(() => {
      expect(getScreen().getByText("January 2020")).not.toBeNull();
    });
  });

  test("renders birthday", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => profileData,
    });

    await waitFor(() => {
      expect(getScreen().getByText("June 15")).not.toBeNull();
    });
  });

  test("renders all three tab triggers", async () => {
    renderProfilePage("/roster/johndoe", {
      "members.profile.get": () => profileData,
    });

    await waitFor(() => {
      expect(getScreen().getByRole("tab", { name: "Details" })).not.toBeNull();
      expect(getScreen().getByRole("tab", { name: "Garage" })).not.toBeNull();
      expect(getScreen().getByRole("tab", { name: "Activity" })).not.toBeNull();
    });
  });
});
