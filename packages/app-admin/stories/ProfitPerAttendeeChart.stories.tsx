import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProfitPerAttendeeChart } from "@app-admin/components/charts/ProfitPerAttendeeChart";
import { mockScenarioMetrics } from "./mockData";

import "@app-admin/index.css";

const meta: Meta<typeof ProfitPerAttendeeChart> = {
  component: ProfitPerAttendeeChart,
  title: "App Admin/Charts/ProfitPerAttendeeChart",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ProfitPerAttendeeChart>;

export const Default: Story = {
  args: {
    metrics: mockScenarioMetrics,
  },
};
