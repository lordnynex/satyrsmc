import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChartCard } from "@app-admin/components/charts/ChartCard";

import "@app-admin/index.css";

const meta: Meta<typeof ChartCard> = {
  component: ChartCard,
  title: "App Admin/Charts/ChartCard",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ChartCard>;

export const Default: Story = {
  args: {
    title: "Revenue",
    description: "Total revenue over the selected period.",
    calculationNote: "Sum of all paid invoices.",
    children: (
      <div className="h-[200px] flex items-center justify-center rounded border border-dashed bg-muted/30 text-muted-foreground text-sm">
        Chart placeholder
      </div>
    ),
  },
};

export const WithBarPlaceholder: Story = {
  args: {
    title: "Cost by category",
    description: "Breakdown of costs by category.",
    calculationNote: "Costs are grouped by the category field on each line item.",
    children: (
      <div className="flex h-32 items-end gap-2">
        {[40, 65, 45, 80, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-primary/80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    ),
  },
};
