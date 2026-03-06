import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { Header } from "@app-admin/components/layout/Header";

import "@app-admin/index.css";

const meta: Meta<typeof Header> = {
  component: Header,
  title: "App Admin/Layout/Header",
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

type Story = StoryObj<typeof Header>;

export const Default: Story = {};
