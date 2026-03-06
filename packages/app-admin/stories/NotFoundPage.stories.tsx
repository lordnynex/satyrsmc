import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { NotFoundPage } from "@app-admin/components/layout/NotFoundPage";

import "@app-admin/index.css";

const meta: Meta<typeof NotFoundPage> = {
  component: NotFoundPage,
  title: "App Admin/Layout/NotFoundPage",
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof NotFoundPage>;

export const Default: Story = {};
