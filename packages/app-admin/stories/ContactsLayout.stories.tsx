import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ContactsLayout } from "@/components/layout/ContactsLayout";

import "@app-admin/index.css";

const meta: Meta = {
  title: "App Admin/Pages/ContactsLayout",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

/** Contacts section layout with sidebar (mailing lists, etc.). Uses mock API so no backend required. */
export const WithMockSidebar: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/contacts"]} basename="/admin">
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background">
          <Header />
        </div>
        <main className="space-y-6 p-4 md:p-6">
          <Routes>
            <Route path="/contacts" element={<ContactsLayout />}>
              <Route
                index
                element={
                  <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
                    <p className="text-sm">Contacts list would load here.</p>
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
