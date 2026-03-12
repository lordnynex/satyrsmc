import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ChartCard } from "./ChartCard";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

interface CostCoverageChartProps {
  metrics: ScenarioMetrics[];
}

export function CostCoverageChart({ metrics }: CostCoverageChartProps) {
  const labels = metrics.map((m) => m.scenarioKey);
  const costCoverage = metrics.map((m) => m.costCoverageRatio);

  const series = [
    {
      name: "Cost Coverage",
      data: costCoverage.map((v) => Math.round(v * 100) / 100),
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
    colors: costCoverage.map((c) => (c >= 1 ? "#22c55e" : "#ef4444")),
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
      formatter: (v) => `${Number(v).toFixed(2)}×`,
    },
    stroke: { show: true, width: 1 },
    xaxis: {
      categories: labels,
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "Cost Coverage" },
      labels: {
        formatter: (v) => `${Number(v).toFixed(1)}×`,
      },
    },
    grid: {
      borderColor: "rgba(255,255,255,0.1)",
      strokeDashArray: 4,
    },
    legend: { show: false },
    annotations: {
      yaxis: [
        {
          y: 1,
          borderColor: "#a78bfa",
          strokeDashArray: 4,
          label: {
            borderColor: "#a78bfa",
            text: "Break-even (1×)",
          },
        },
      ],
    },
  };

  return (
    <ChartCard
      title="Cost Coverage Ratio"
      description="Revenue ÷ costs. At 1× you break even; above 1× you're profitable."
      calculationNote="Gross Revenue ÷ Total Costs"
    >
      <Chart options={options} series={series} type="bar" height={280} />
    </ChartCard>
  );
}
