import type { Meta, StoryObj } from "@storybook/react-vite";
import { Routes, Route } from "react-router-dom";
import { MemoryRouter } from "react-router-dom";
import { Header } from "@app-admin/components/layout/Header";
import { EventsLayout } from "@app-admin/components/layout/EventsLayout";

import "@app-admin/index.css";

const meta: Meta = {
  title: "App Admin/Pages/EventsLayout",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

/** Events section layout (sidebar + content). Content area shows placeholder; real Events list requires API. */
export const LayoutOnly: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/events"]} basename="/admin">
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background">
          <Header />
        </div>
        <main className="space-y-6 p-4 md:p-6">
          <Routes>
            <Route path="/events" element={<EventsLayout />}>
              <Route
                index
                element={
                  <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
                    <p className="text-sm">Events list would load here (requires API).</p>
                    <p className="mt-2 text-xs">Sidebar shows Events sub-navigation.</p>
                  </div>
                }
              />
            </Route>
          </Routes>
        </main>
      </div>
    </MemoryRouter>
  ),
};
