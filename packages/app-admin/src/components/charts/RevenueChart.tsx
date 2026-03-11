import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ChartCard } from "./ChartCard";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

interface RevenueChartProps {
  metrics: ScenarioMetrics[];
}

export function RevenueChart({ metrics }: RevenueChartProps) {
  const labels = metrics.map((m) => m.scenarioKey);
  const revenue = metrics.map((m) => m.revenue);

  const series = [
    {
      name: "Gross Revenue",
      data: revenue,
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
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (v) => `$${(Number(v) / 1000).toFixed(0)}k`,
    },
    stroke: { show: true, width: 1 },
    xaxis: {
      categories: labels,
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "Gross Revenue ($)" },
    },
    grid: {
      borderColor: "rgba(255,255,255,0.1)",
      strokeDashArray: 4,
    },
    legend: { show: false },
  };

  return (
    <ChartCard
      title="Gross Revenue Projections"
      description="Gross revenue: total ticket income before costs. Higher attendance and ticket prices increase revenue."
      calculationNote="(Attendees × Ticket Price) + (Staff × Staff Price)"
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
