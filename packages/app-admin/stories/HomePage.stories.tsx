import type { Meta, StoryObj } from "@storybook/react-vite";
import { HomePage } from "@app-admin/components/layout/HomePage";
import { AppShell } from "./AppShell";

import "@app-admin/index.css";

const meta: Meta<typeof HomePage> = {
  component: HomePage,
  title: "App Admin/Pages/HomePage",
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <AppShell initialEntries={["/"]}>
        <Story />
      </AppShell>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof HomePage>;

export const Default: Story = {};
