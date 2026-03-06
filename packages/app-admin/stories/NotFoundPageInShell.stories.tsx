import type { Meta, StoryObj } from "@storybook/react-vite";
import { NotFoundPage } from "@app-admin/components/layout/NotFoundPage";
import { AppShell } from "./AppShell";

import "@app-admin/index.css";

const meta: Meta<typeof NotFoundPage> = {
  component: NotFoundPage,
  title: "App Admin/Pages/NotFoundPage",
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <AppShell initialEntries={["/nonexistent-page"]}>
        <Story />
      </AppShell>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof NotFoundPage>;

export const InAppShell: Story = {};
