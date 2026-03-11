import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ChartCard } from "./ChartCard";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

interface PnLChartProps {
  metrics: ScenarioMetrics[];
  profitTarget?: number;
}

export function PnLChart({ metrics, profitTarget }: PnLChartProps) {
  const labels = metrics.map((m) => m.scenarioKey);
  const profit = metrics.map((m) => m.profit);

  const series = [
    {
      name: "Net Revenue",
      data: profit,
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
    colors: profit.map((p) => (p >= 0 ? "#22c55e" : "#ef4444")),
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
      formatter: (v) => `$${Number(v).toLocaleString()}`,
    },
    stroke: { show: true, width: 1 },
    xaxis: {
      categories: labels,
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "Net Revenue ($)" },
    },
    grid: {
      borderColor: "rgba(255,255,255,0.1)",
      strokeDashArray: 4,
    },
    legend: { show: false },
    ...(typeof profitTarget === "number" && {
      annotations: {
        yaxis: [
          {
            y: profitTarget,
            borderColor: "#a78bfa",
            strokeDashArray: 4,
            label: {
              borderColor: "#a78bfa",
              style: {
                color: "#fff",
                background: "#a78bfa",
              },
              text: `Profit target: $${profitTarget.toLocaleString()}`,
            },
          },
        ],
      },
    }),
  };

  return (
    <ChartCard
      title="Net Revenue by Scenario"
      description="Gross revenue minus total costs. Green = profitable; red = loss."
      calculationNote="Gross Revenue − Total Costs"
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
