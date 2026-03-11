import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ChartCard } from "./ChartCard";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

interface ProfitPerAttendeeChartProps {
  metrics: ScenarioMetrics[];
}

export function ProfitPerAttendeeChart({ metrics }: ProfitPerAttendeeChartProps) {
  const labels = metrics.map((m) => m.scenarioKey);
  const profitPerAttendee = metrics.map((m) => m.profitPerAttendee);

  const series = [
    {
      name: "Profit per Attendee",
      data: profitPerAttendee.map((v) => Math.round(v * 100) / 100),
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
    colors: profitPerAttendee.map((p) => (p >= 0 ? "#22c55e" : "#ef4444")),
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
      title: { text: "Profit per Attendee ($)" },
    },
    grid: {
      borderColor: "rgba(255,255,255,0.1)",
      strokeDashArray: 4,
    },
    legend: { show: false },
  };

  return (
    <ChartCard
      title="Profit per Attendee"
      description="How much profit each attendee generates. Higher values mean more efficient revenue per person."
      calculationNote="Net Revenue ÷ Attendees"
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
