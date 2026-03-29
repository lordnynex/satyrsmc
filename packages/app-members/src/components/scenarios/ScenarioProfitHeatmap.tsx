import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

interface ScenarioProfitHeatmapProps {
  metrics: ScenarioMetrics[];
  profitTarget?: number;
}

export function ScenarioProfitHeatmap({ metrics, profitTarget = 0 }: ScenarioProfitHeatmapProps) {
  if (metrics.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No scenario data. Select a scenario and budget to see the heatmap.
        </CardContent>
      </Card>
    );
  }

  const attendanceLevels = [...new Set(metrics.map((m) => m.attendancePercent))].sort(
    (a, b) => a - b,
  );
  const ticketPrices = [...new Set(metrics.map((m) => m.ticketPrice))].sort((a, b) => a - b);
  const staffPrices = [...new Set(metrics.map((m) => m.staffPrice))].sort((a, b) => a - b);
  const columnKeys: string[] = [];
  for (const tp of ticketPrices) {
    for (const sp of staffPrices) {
      if (sp <= tp) columnKeys.push(`$${tp}/$${sp}`);
    }
  }

  const byKey = new Map<string, ScenarioMetrics>();
  for (const m of metrics) {
    byKey.set(`${m.attendancePercent}-${m.ticketPrice}-${m.staffPrice}`, m);
  }

  const attendeesByPct = new Map<number, number>();
  for (const m of metrics) {
    if (!attendeesByPct.has(m.attendancePercent)) {
      attendeesByPct.set(m.attendancePercent, m.attendees);
    }
  }

  const minProfit = Math.min(...metrics.map((m) => m.profit));
  const maxProfit = Math.max(...metrics.map((m) => m.profit));

  const series = attendanceLevels.map((pct) => ({
    name: `${pct}% (${attendeesByPct.get(pct) ?? 0} tickets)`,
    data: columnKeys.map((col) => {
      const [ticketPart, staffPart] = col.replace("$", "").split("/$");
      const ticketPrice = Number(ticketPart);
      const staffPrice = Number(staffPart);
      const m = byKey.get(`${pct}-${ticketPrice}-${staffPrice}`);
      return { x: col, y: m?.profit ?? 0 };
    }),
  }));

  const options: ApexOptions = {
    chart: {
      type: "heatmap",
      fontFamily: "inherit",
      background: "transparent",
      toolbar: { show: false },
    },
    theme: { mode: "dark" },
    dataLabels: {
      enabled: true,
      formatter: (val) => {
        return typeof val === "number" ? `$${Math.round(val).toLocaleString()}` : "";
      },
    },
    legend: { show: false },
    plotOptions: {
      heatmap: {
        colorScale: {
          ranges: [
            ...(minProfit < 0
              ? [{ from: minProfit, to: -0.01, color: "#ef4444", name: "Loss" }]
              : []),
            ...(maxProfit >= 0 && profitTarget > 0
              ? [
                  {
                    from: 0,
                    to: profitTarget - 0.01,
                    color: "#f97316",
                    name: "Profit (below target)",
                  },
                ]
              : []),
            ...(maxProfit >= 0
              ? [
                  {
                    from: Math.max(0, profitTarget),
                    to: Math.max(maxProfit, profitTarget + 1),
                    color: "#22c55e",
                    name: "Meets target",
                  },
                ]
              : []),
          ],
        },
        distributed: false,
      },
    },
    xaxis: {
      labels: { rotate: -45 },
    },
    tooltip: {
      y: {
        formatter: (val) => (typeof val === "number" ? `$${val.toLocaleString()}` : ""),
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by Scenario</CardTitle>
        <CardDescription>
          Net revenue (Gross − costs) by scenario. Green = meets target; orange = profitable but
          below target; red = loss.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Chart
          options={options}
          series={series}
          type="heatmap"
          height={Math.max(400, attendanceLevels.length * 36)}
        />
      </CardContent>
    </Card>
  );
}
