import type { Meta, StoryObj } from "@storybook/react-vite";
import { CostPerCategoryChart } from "@app-admin/components/charts/CostPerCategoryChart";
import { mockLineItems } from "./mockData";

import "@app-admin/index.css";

const meta: Meta<typeof CostPerCategoryChart> = {
  component: CostPerCategoryChart,
  title: "App Admin/Charts/CostPerCategoryChart",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof CostPerCategoryChart>;

export const Default: Story = {
  args: {
    lineItems: mockLineItems,
  },
};
