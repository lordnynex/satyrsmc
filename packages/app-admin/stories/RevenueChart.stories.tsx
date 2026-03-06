import type { Meta, StoryObj } from "@storybook/react-vite";
import { RevenueChart } from "@app-admin/components/charts/RevenueChart";
import { mockScenarioMetrics } from "./mockData";

import "@app-admin/index.css";

const meta: Meta<typeof RevenueChart> = {
  component: RevenueChart,
  title: "App Admin/Charts/RevenueChart",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof RevenueChart>;

export const Default: Story = {
  args: {
    metrics: mockScenarioMetrics,
  },
};
