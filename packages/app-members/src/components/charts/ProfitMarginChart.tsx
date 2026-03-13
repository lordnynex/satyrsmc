import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ChartCard } from "./ChartCard";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

interface ProfitMarginChartProps {
  metrics: ScenarioMetrics[];
}

export function ProfitMarginChart({ metrics }: ProfitMarginChartProps) {
  const labels = metrics.map((m) => m.scenarioKey);
  const profitMargin = metrics.map((m) => m.profitMargin);

  const series = [
    {
      name: "Profit Margin",
      data: profitMargin.map((v) => Math.round(v * 10) / 10),
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
    colors: profitMargin.map((p) => (p >= 0 ? "#22c55e" : "#ef4444")),
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 4,
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (v) => `${Number(v).toFixed(1)}%`,
    },
    stroke: { show: true, width: 1 },
    xaxis: {
      categories: labels,
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "Profit Margin (%)" },
      labels: {
        formatter: (v) => `${Number(v).toFixed(0)}%`,
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
      title="Profit Margin"
      description="Profit as % of revenue. Higher margin means more of each dollar stays as profit."
      calculationNote="(Net Revenue ÷ Gross Revenue) × 100"
    >
      <Chart options={options} series={series} type="bar" height={280} />
    </ChartCard>
  );
}
