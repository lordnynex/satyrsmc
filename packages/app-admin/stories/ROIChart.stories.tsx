import type { Meta, StoryObj } from "@storybook/react-vite";
import { ROIChart } from "@app-admin/components/charts/ROIChart";
import { mockScenarioMetrics } from "./mockData";

import "@app-admin/index.css";

const meta: Meta<typeof ROIChart> = {
  component: ROIChart,
  title: "App Admin/Charts/ROIChart",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ROIChart>;

export const Default: Story = {
  args: {
    metrics: mockScenarioMetrics,
  },
};
