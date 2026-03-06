import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

import "@app-admin/index.css";

const meta: Meta<typeof AppShell> = {
  component: AppShell,
  title: "App Admin/Pages/AppShell",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof AppShell>;

/** Full app shell with header and main content area. Use this layout in other page stories. */
export const WithPlaceholder: Story = {
  render: () => (
    <AppShell initialEntries={["/"]}>
      <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
        <p className="text-sm">Page content would render here.</p>
        <p className="mt-2 text-xs">Navigate using the header to see different sections.</p>
      </div>
    </AppShell>
  ),
};
