import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ChartCard } from "./ChartCard";
import type { LineItem } from "@satyrsmc/shared/client";

interface CostPerCategoryChartProps {
  lineItems: LineItem[];
}

export function CostPerCategoryChart({ lineItems }: CostPerCategoryChartProps) {
  const categoryTotals = lineItems.reduce(
    (acc, li) => {
      const total = li.unitCost * li.quantity;
      acc[li.category] = (acc[li.category] ?? 0) + total;
      return acc;
    },
    {} as Record<string, number>
  );

  const categories = Object.keys(categoryTotals).sort();
  const data = categories.map((c) => Math.round(categoryTotals[c] * 100) / 100);

  const series = data;
  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
      background: "transparent",
    },
    theme: { mode: "dark" },
    labels: categories,
    colors: [
      "#3b82f6",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
    ],
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        const total = opts.w.config.series.reduce((a: number, b: number) => a + b, 0);
        const pct = total > 0 ? ((opts.w.config.series[opts.seriesIndex] as number) / total) * 100 : 0;
        return `${pct.toFixed(0)}%`;
      },
    },
    legend: {
      position: "bottom",
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: () => {
                const total = data.reduce((a, b) => a + b, 0);
                return `$${total.toLocaleString()}`;
              },
            },
          },
        },
      },
    },
  };

  return (
    <ChartCard
      title="Cost by Category"
      description="How your event budget is distributed across expense categories."
      calculationNote="Sum of (Unit Cost × Quantity) for each line item, grouped by category"
    >
      <Chart
        options={options}
        series={series}
        type="donut"
        height={300}
      />
    </ChartCard>
  );
}
