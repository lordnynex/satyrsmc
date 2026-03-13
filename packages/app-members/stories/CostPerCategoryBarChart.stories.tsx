import type { Meta, StoryObj } from "@storybook/react-vite";
import { CostPerCategoryBarChart } from "@app-members/components/charts/CostPerCategoryBarChart";
import { mockLineItems } from "./mockData";

import "@app-members/index.css";

const meta: Meta<typeof CostPerCategoryBarChart> = {
  component: CostPerCategoryBarChart,
  title: "App Admin/Charts/CostPerCategoryBarChart",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof CostPerCategoryBarChart>;

export const Default: Story = {
  args: {
    lineItems: mockLineItems,
  },
};
