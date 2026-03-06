import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageLoading } from "@app-admin/components/layout/PageLoading";

import "@app-admin/index.css";

const meta: Meta<typeof PageLoading> = {
  component: PageLoading,
  title: "App Admin/Layout/PageLoading",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof PageLoading>;

export const Default: Story = {};
