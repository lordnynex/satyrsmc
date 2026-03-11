import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROIChart } from "@/components/charts/ROIChart";
import { PnLChart } from "@/components/charts/PnLChart";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { ProfitMarginChart } from "@/components/charts/ProfitMarginChart";
import { ProfitPerAttendeeChart } from "@/components/charts/ProfitPerAttendeeChart";
import { CostCoverageChart } from "@/components/charts/CostCoverageChart";
import { cn } from "@/lib/utils";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

function getTabColor(metrics: ScenarioMetrics[]): "profit" | "breakEven" | "loss" {
  const anyMeetsTarget = metrics.some((m) => m.profitVsBreakEven >= 0);
  const anyProfitable = metrics.some((m) => m.profit >= 0);
  if (anyMeetsTarget) return "profit";
  if (anyProfitable) return "breakEven";
  return "loss";
}

interface ScenarioMatrixTableProps {
  metrics: ScenarioMetrics[];
  profitTarget?: number;
}

function SingleScenarioTable({
  title,
  metrics,
  profitTarget,
}: {
  title: string;
  metrics: ScenarioMetrics[];
  profitTarget?: number;
}) {
  const sorted = [...metrics].sort((a, b) => {
    if (a.profit !== b.profit) return a.profit - b.profit;
    if (a.ticketPrice !== b.ticketPrice) return a.ticketPrice - b.ticketPrice;
    return a.staffPrice - b.staffPrice;
  });
  const showCharts = metrics.length > 1 && metrics.length <= 12;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>
            {metrics[0]?.attendees} attendees. Gross = ticket income; Net = Gross − costs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Ticket Cost</th>
                  <th className="p-2 text-left font-medium">Staff Cost</th>
                  <th className="p-2 text-left font-medium">Attendance</th>
                  <th className="p-2 text-right font-medium">Gross Revenue</th>
                  <th className="p-2 text-right font-medium">Net Revenue</th>
                  <th className="p-2 text-right font-medium">Profit Margin</th>
                  <th className="p-2 text-right font-medium">Profit/Attendee</th>
                  <th className="p-2 text-right font-medium">Cost Coverage</th>
                  <th className="p-2 text-right font-medium">Rev/Ticket</th>
                  <th className="p-2 text-right font-medium">Attendee %</th>
                  <th className="p-2 text-right font-medium">Break-ev Att %</th>
                  <th className="p-2 text-right font-medium">Target Cov %</th>
                  <th className="p-2 text-right font-medium">Meets target</th>
                  <th className="p-2 text-right font-medium">Cost/person</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => (
                  <tr
                    key={m.scenarioKey}
                    className={`border-b transition-colors hover:bg-muted/30 ${
                      m.profit >= 0 ? "" : "bg-destructive/5"
                    }`}
                  >
                    <td className="p-2">${m.ticketPrice}</td>
                    <td className="p-2">${m.staffPrice}</td>
                    <td className="p-2">{m.attendancePercent}%</td>
                    <td className="p-2 text-right tabular-nums">${m.revenue.toLocaleString()}</td>
                    <td
                      className={`p-2 text-right tabular-nums font-medium ${
                        m.profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ${m.profit.toLocaleString()}
                    </td>
                    <td className="p-2 text-right tabular-nums">{m.profitMargin.toFixed(1)}%</td>
                    <td className="p-2 text-right tabular-nums">
                      ${m.profitPerAttendee.toFixed(0)}
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      {m.costCoverageRatio.toFixed(2)}×
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      ${m.avgRevenuePerTicket.toFixed(0)}
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      {m.revenueMixAttendee.toFixed(0)}%
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      {m.breakEvenAttendancePercent != null
                        ? `${Math.round(m.breakEvenAttendancePercent)}%`
                        : "—"}
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      {m.profitTargetCoverage != null
                        ? `${m.profitTargetCoverage.toFixed(0)}%`
                        : "—"}
                    </td>
                    <td className="p-2 text-right">
                      {m.profitVsBreakEven >= 0 ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-amber-600">No</span>
                      )}
                    </td>
                    <td className="p-2 text-right tabular-nums">${m.costPerAttendee.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {showCharts && (
        <section className="grid gap-6 md:grid-cols-2">
          <ROIChart metrics={metrics} />
          <PnLChart metrics={metrics} profitTarget={profitTarget} />
          <RevenueChart metrics={metrics} />
          <ProfitMarginChart metrics={metrics} />
          <ProfitPerAttendeeChart metrics={metrics} />
          <CostCoverageChart metrics={metrics} />
        </section>
      )}
    </div>
  );
}

export function ScenarioMatrixTable({ metrics, profitTarget }: ScenarioMatrixTableProps) {
  const byAttendance = metrics.reduce(
    (acc, m) => {
      const key = m.attendancePercent;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    },
    {} as Record<number, ScenarioMetrics[]>,
  );

  const attendanceLevels = Object.keys(byAttendance)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((pct) => pct >= 50);

  const firstProfitableTab = String(
    attendanceLevels.find((pct) => byAttendance[pct].some((m) => m.profit >= 0)) ??
      attendanceLevels[0],
  );

  const [activeTab, setActiveTab] = useState(firstProfitableTab);
  useEffect(() => {
    setActiveTab(firstProfitableTab);
  }, [firstProfitableTab]);

  const tabColorClasses = {
    profit:
      "!text-green-600 hover:!text-green-600 data-[state=active]:!text-green-600 data-[state=active]:border-green-500 data-[state=active]:bg-green-500/10 data-[state=active]:after:bg-green-500",
    breakEven:
      "!text-amber-600 hover:!text-amber-600 data-[state=active]:!text-amber-600 data-[state=active]:border-amber-500 data-[state=active]:bg-amber-500/10 data-[state=active]:after:bg-amber-500",
    loss: "!text-red-600 hover:!text-red-600 data-[state=active]:!text-red-600 data-[state=active]:border-red-500 data-[state=active]:bg-red-500/10 data-[state=active]:after:bg-red-500",
  };

  if (attendanceLevels.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Scenario matrix</h2>
        <p className="text-muted-foreground text-sm">No scenarios to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Scenario matrix</h2>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          {attendanceLevels.map((pct) => {
            const tabMetrics = byAttendance[pct];
            const color = getTabColor(tabMetrics);
            return (
              <TabsTrigger
                key={pct}
                value={String(pct)}
                className={cn("font-medium", tabColorClasses[color])}
              >
                {pct}% attendance
              </TabsTrigger>
            );
          })}
        </TabsList>
        {attendanceLevels.map((pct) => (
          <TabsContent key={pct} value={String(pct)} className="mt-4">
            <SingleScenarioTable
              title={`${pct}% attendance`}
              metrics={byAttendance[pct]}
              profitTarget={profitTarget}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
