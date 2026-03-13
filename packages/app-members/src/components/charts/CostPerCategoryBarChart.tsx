import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ChartCard } from "./ChartCard";
import type { LineItem } from "@satyrsmc/shared/client";

interface CostPerCategoryBarChartProps {
  lineItems: LineItem[];
}

export function CostPerCategoryBarChart({ lineItems }: CostPerCategoryBarChartProps) {
  const categoryTotals = lineItems.reduce(
    (acc, li) => {
      const total = li.unitCost * li.quantity;
      acc[li.category] = (acc[li.category] ?? 0) + total;
      return acc;
    },
    {} as Record<string, number>,
  );

  const categories = Object.keys(categoryTotals).sort();
  const data = categories.map((c) => Math.round(categoryTotals[c] * 100) / 100);

  const series = [
    {
      name: "Cost",
      data,
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
      background: "transparent",
    },
    theme: { mode: "dark" },
    colors: ["#3b82f6"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: "70%",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `$${Number(val).toLocaleString()}`,
    },
    xaxis: {
      categories,
    },
    yaxis: {
      labels: {
        maxWidth: 120,
      },
    },
    grid: {
      borderColor: "rgba(255,255,255,0.1)",
      strokeDashArray: 4,
    },
    legend: { show: false },
  };

  return (
    <ChartCard
      title="Cost by Category (Bar)"
      description="Side-by-side view of spending by category. Helps compare category sizes."
      calculationNote="Sum of (Unit Cost × Quantity) for each line item, grouped by category"
    >
      <Chart
        options={options}
        series={series}
        type="bar"
        height={Math.max(200, categories.length * 40)}
      />
    </ChartCard>
  );
}
