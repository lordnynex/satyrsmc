import type { Meta, StoryObj } from "@storybook/react-vite";
import { PnLChart } from "@app-admin/components/charts/PnLChart";
import { mockScenarioMetrics } from "./mockData";

import "@app-admin/index.css";

const meta: Meta<typeof PnLChart> = {
  component: PnLChart,
  title: "App Admin/Charts/PnLChart",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof PnLChart>;

export const Default: Story = {
  args: {
    metrics: mockScenarioMetrics,
  },
};

export const WithProfitTarget: Story = {
  args: {
    metrics: mockScenarioMetrics,
    profitTarget: 2000,
  },
};
