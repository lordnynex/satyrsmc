import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ChartCard } from "./ChartCard";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

interface ROIChartProps {
  metrics: ScenarioMetrics[];
}

export function ROIChart({ metrics }: ROIChartProps) {
  const labels = metrics.map((m) => m.scenarioKey);
  const roi = metrics.map((m) => m.roi);

  const series = [
    {
      name: "ROI (Net Revenue/Costs)",
      data: roi.map((v) => Math.round(v * 100) / 100),
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
    colors: ["#22c55e"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 1 },
    xaxis: {
      categories: labels,
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "ROI" },
      labels: {
        formatter: (v) => (v >= 0 ? `${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`),
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
      title="Return on Investment (ROI)"
      description="Net revenue per dollar of cost. Positive values mean the event is profitable."
      calculationNote="Net Revenue ÷ Total Costs"
    >
      <Chart
        options={options}
        series={series}
        type="bar"
        height={280}
      />
    </ChartCard>
  );
}
