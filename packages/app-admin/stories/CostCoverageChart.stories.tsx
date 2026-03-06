import type { Meta, StoryObj } from "@storybook/react-vite";
import { CostCoverageChart } from "@app-admin/components/charts/CostCoverageChart";
import { mockScenarioMetrics } from "./mockData";

import "@app-admin/index.css";

const meta: Meta<typeof CostCoverageChart> = {
  component: CostCoverageChart,
  title: "App Admin/Charts/CostCoverageChart",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof CostCoverageChart>;

export const Default: Story = {
  args: {
    metrics: mockScenarioMetrics,
  },
};
