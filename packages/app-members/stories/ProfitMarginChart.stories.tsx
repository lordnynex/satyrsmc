import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProfitMarginChart } from "@app-members/components/charts/ProfitMarginChart";
import { mockScenarioMetrics } from "./mockData";

import "@app-members/index.css";

const meta: Meta<typeof ProfitMarginChart> = {
  component: ProfitMarginChart,
  title: "App Admin/Charts/ProfitMarginChart",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ProfitMarginChart>;

export const Default: Story = {
  args: {
    metrics: mockScenarioMetrics,
  },
};
