import { useEffect, useRef, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import ApexCharts from "apexcharts";
import type { LineItem, ScenarioMetrics } from "@satyrsmc/shared/client";
import { getCategoryTotals } from "@/export/exportData";

const CHART_IDS = {
  costDonut: "export-cost-donut",
  costBar: "export-cost-bar",
  heatmap: "export-heatmap",
} as const;

interface ExportChartsProps {
  lineItems: LineItem[];
  metrics: ScenarioMetrics[];
  profitTarget?: number;
  onChartsReady: (images: Record<string, string>) => void;
}

export function ExportCharts({
  lineItems,
  metrics,
  profitTarget = 0,
  onChartsReady,
}: ExportChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const byAttendance = metrics.reduce(
    (acc, m) => {
      const key = m.attendancePercent;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    },
    {} as Record<number, ScenarioMetrics[]>,
  );
  const scenarioChartKeys: Array<{ key: string; id: string }> = [];
  for (const pct of [...new Set(metrics.map((m) => m.attendancePercent))].sort((a, b) => a - b)) {
    const tableMetrics = byAttendance[pct] ?? [];
    if (tableMetrics.length > 1 && tableMetrics.length <= 12) {
      for (const chartType of [
        "ROI",
        "PnL",
        "Revenue",
        "ProfitMargin",
        "ProfitPerAttendee",
        "CostCoverage",
      ]) {
        scenarioChartKeys.push({
          key: `scenario-${pct}-${chartType}`,
          id: `export-scenario-${pct}-${chartType}`,
        });
      }
    }
  }

  useEffect(() => {
    if (!mounted || doneRef.current) return;

    const timer = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      setIsCapturing(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [mounted, metrics.length]);

  useEffect(() => {
    if (!isCapturing) return;

    let delayTimer: ReturnType<typeof setTimeout>;

    const capture = async () => {
      await new Promise<void>((resolve) => {
        delayTimer = setTimeout(resolve, 400);
      });

      const images: Record<string, string> = {};
      try {
        for (const [key, id] of Object.entries(CHART_IDS)) {
          const result = await ApexCharts.exec(id, "dataURI", {
            quality: 1,
            scale: 2,
          });
          if (result?.imgURI) images[key] = result.imgURI;
        }
        for (const { key, id } of scenarioChartKeys) {
          try {
            const result = await ApexCharts.exec(id, "dataURI", {
              quality: 1,
              scale: 2,
            });
            if (result?.imgURI) images[key] = result.imgURI;
          } catch {
            /* chart not ready */
          }
        }
      } catch {
        /* fallback */
      }
      setIsCapturing(false);
      onChartsReady(images);
    };

    capture();

    return () => clearTimeout(delayTimer);
  }, [isCapturing, onChartsReady]);

  const categoryTotals = getCategoryTotals(lineItems);
  const categories = Object.keys(categoryTotals).sort();
  const costData = categories.map((c) => Math.round(categoryTotals[c] * 100) / 100);

  const donutOptions: ApexOptions = {
    chart: {
      id: CHART_IDS.costDonut,
      type: "donut",
      fontFamily: "inherit",
      background: "#fff",
    },
    theme: { mode: "light" },
    labels: categories,
    colors: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"],
    dataLabels: { enabled: true },
    legend: { position: "bottom" },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: () => {
                const total = costData.reduce((a, b) => a + b, 0);
                return `$${total.toLocaleString()}`;
              },
            },
          },
        },
      },
    },
  };

  const barOptions: ApexOptions = {
    chart: {
      id: CHART_IDS.costBar,
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
      background: "#fff",
    },
    theme: { mode: "light" },
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
    xaxis: { categories },
    legend: { show: false },
  };

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
  const heatmapSeries = attendanceLevels.map((pct) => ({
    name: `${pct}% (${attendeesByPct.get(pct) ?? 0} tickets)`,
    data: columnKeys.map((col) => {
      const [ticketPart, staffPart] = col.replace("$", "").split("/$");
      const ticketPrice = Number(ticketPart);
      const staffPrice = Number(staffPart);
      const m = byKey.get(`${pct}-${ticketPrice}-${staffPrice}`);
      return { x: col, y: m?.profit ?? 0 };
    }),
  }));

  const heatmapOptions: ApexOptions = {
    chart: {
      id: CHART_IDS.heatmap,
      type: "heatmap",
      fontFamily: "inherit",
      background: "#fff",
      toolbar: { show: false },
    },
    theme: { mode: "light" },
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
      },
    },
    xaxis: { labels: { rotate: -45 } },
  };

  return (
    <div
      className={`pointer-events-none fixed left-0 top-0 min-h-screen w-[800px] overflow-visible bg-white transition-opacity duration-150 ${isCapturing ? "z-[9999] opacity-100" : "z-[-1] opacity-0"}`}
      aria-hidden
    >
      <div className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-black">Cost by Category</h3>
        <Chart options={donutOptions} series={costData} type="donut" height={280} />
      </div>
      <div className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-black">Cost by Category (Bar)</h3>
        <Chart
          options={barOptions}
          series={[{ name: "Cost", data: costData }]}
          type="bar"
          height={Math.max(200, categories.length * 40)}
        />
      </div>
      <div className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-black">Profit by Scenario</h3>
        <Chart
          options={heatmapOptions}
          series={heatmapSeries}
          type="heatmap"
          height={Math.max(400, attendanceLevels.length * 36)}
        />
      </div>
      {(
        [...new Set(metrics.map((m) => m.attendancePercent))].sort((a, b) => a - b) as number[]
      ).map((pct) => {
        const tableMetrics = (byAttendance[pct] ?? []).slice().sort((a, b) => {
          if (a.profit !== b.profit) return a.profit - b.profit;
          if (a.ticketPrice !== b.ticketPrice) return a.ticketPrice - b.ticketPrice;
          return a.staffPrice - b.staffPrice;
        });
        const showCharts = tableMetrics.length > 1 && tableMetrics.length <= 12;
        if (!showCharts) return null;
        const chartLabels = tableMetrics.map((m) => `$${m.ticketPrice}/$${m.staffPrice}`);
        const baseChartOpts = {
          fontFamily: "inherit" as const,
          background: "#fff",
          toolbar: { show: false },
        };
        return (
          <div key={pct} className="grid grid-cols-2 gap-3 p-4">
            <div>
              <h3 className="mb-1 text-xs font-semibold text-black">{pct}% – ROI</h3>
              <Chart
                options={{
                  chart: { id: `export-scenario-${pct}-ROI`, type: "bar", ...baseChartOpts },
                  theme: { mode: "light" },
                  colors: ["#22c55e"],
                  plotOptions: { bar: { horizontal: false, columnWidth: "60%", borderRadius: 4 } },
                  dataLabels: { enabled: false },
                  xaxis: {
                    categories: chartLabels,
                    labels: { rotate: -45, style: { fontSize: "9px" } },
                  },
                  yaxis: { labels: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` } },
                  legend: { show: false },
                }}
                series={[
                  { name: "ROI", data: tableMetrics.map((m) => Math.round(m.roi * 100) / 100) },
                ]}
                type="bar"
                height={150}
              />
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold text-black">{pct}% – Net Revenue</h3>
              <Chart
                options={{
                  chart: { id: `export-scenario-${pct}-PnL`, type: "bar", ...baseChartOpts },
                  theme: { mode: "light" },
                  colors: tableMetrics.map((m) => (m.profit >= 0 ? "#22c55e" : "#ef4444")),
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
                    formatter: (v: number) => `$${Number(v).toLocaleString()}`,
                  },
                  xaxis: {
                    categories: chartLabels,
                    labels: { rotate: -45, style: { fontSize: "9px" } },
                  },
                  legend: { show: false },
                }}
                series={[{ name: "Profit", data: tableMetrics.map((m) => m.profit) }]}
                type="bar"
                height={150}
              />
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold text-black">{pct}% – Gross Revenue</h3>
              <Chart
                options={{
                  chart: { id: `export-scenario-${pct}-Revenue`, type: "bar", ...baseChartOpts },
                  theme: { mode: "light" },
                  colors: ["#3b82f6"],
                  plotOptions: { bar: { horizontal: false, columnWidth: "60%", borderRadius: 4 } },
                  dataLabels: {
                    enabled: true,
                    formatter: (v: number) => `$${(Number(v) / 1000).toFixed(0)}k`,
                  },
                  xaxis: {
                    categories: chartLabels,
                    labels: { rotate: -45, style: { fontSize: "9px" } },
                  },
                  legend: { show: false },
                }}
                series={[{ name: "Revenue", data: tableMetrics.map((m) => m.revenue) }]}
                type="bar"
                height={150}
              />
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold text-black">{pct}% – Profit Margin</h3>
              <Chart
                options={{
                  chart: {
                    id: `export-scenario-${pct}-ProfitMargin`,
                    type: "bar",
                    ...baseChartOpts,
                  },
                  theme: { mode: "light" },
                  colors: tableMetrics.map((m) => (m.profitMargin >= 0 ? "#22c55e" : "#ef4444")),
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
                    formatter: (v: number) => `${Number(v).toFixed(1)}%`,
                  },
                  xaxis: {
                    categories: chartLabels,
                    labels: { rotate: -45, style: { fontSize: "9px" } },
                  },
                  yaxis: { labels: { formatter: (v: number) => `${Number(v).toFixed(0)}%` } },
                  legend: { show: false },
                }}
                series={[
                  {
                    name: "Profit Margin",
                    data: tableMetrics.map((m) => Math.round(m.profitMargin * 10) / 10),
                  },
                ]}
                type="bar"
                height={150}
              />
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold text-black">{pct}% – Profit/Attendee</h3>
              <Chart
                options={{
                  chart: {
                    id: `export-scenario-${pct}-ProfitPerAttendee`,
                    type: "bar",
                    ...baseChartOpts,
                  },
                  theme: { mode: "light" },
                  colors: tableMetrics.map((m) =>
                    m.profitPerAttendee >= 0 ? "#22c55e" : "#ef4444",
                  ),
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
                    formatter: (v: number) => `$${Number(v).toLocaleString()}`,
                  },
                  xaxis: {
                    categories: chartLabels,
                    labels: { rotate: -45, style: { fontSize: "9px" } },
                  },
                  legend: { show: false },
                }}
                series={[
                  {
                    name: "Profit/Attendee",
                    data: tableMetrics.map((m) => Math.round(m.profitPerAttendee * 100) / 100),
                  },
                ]}
                type="bar"
                height={150}
              />
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold text-black">{pct}% – Cost Coverage</h3>
              <Chart
                options={{
                  chart: {
                    id: `export-scenario-${pct}-CostCoverage`,
                    type: "bar",
                    ...baseChartOpts,
                  },
                  theme: { mode: "light" },
                  colors: tableMetrics.map((m) =>
                    m.costCoverageRatio >= 1 ? "#22c55e" : "#ef4444",
                  ),
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
                    formatter: (v: number) => `${Number(v).toFixed(2)}×`,
                  },
                  xaxis: {
                    categories: chartLabels,
                    labels: { rotate: -45, style: { fontSize: "9px" } },
                  },
                  yaxis: { labels: { formatter: (v: number) => `${Number(v).toFixed(1)}×` } },
                  legend: { show: false },
                }}
                series={[
                  {
                    name: "Cost Coverage",
                    data: tableMetrics.map((m) => Math.round(m.costCoverageRatio * 100) / 100),
                  },
                ]}
                type="bar"
                height={150}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
