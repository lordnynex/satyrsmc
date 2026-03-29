import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { Inputs, LineItem, ScenarioMetrics } from "@satyrsmc/shared/client";
import {
  computeExportSummary,
  computeExportFoodCost,
  computeExportScenarioMatrix,
  getCategoryTotals,
} from "@/export/exportData";

interface PrintViewProps {
  state: {
    inputs: Inputs;
    lineItems: LineItem[];
    budget?: { name: string; year: number } | null;
    scenario?: { name: string } | null;
  };
  metrics: ScenarioMetrics[];
}

export function PrintView({ state, metrics }: PrintViewProps) {
  const totalCosts = state.lineItems.reduce((sum, li) => sum + li.unitCost * li.quantity, 0);
  const summary = computeExportSummary(state.inputs, state.lineItems, metrics);
  const foodCost = computeExportFoodCost(state.inputs, state.lineItems);
  const scenarioMatrix = computeExportScenarioMatrix(metrics);
  const categoryTotals = getCategoryTotals(state.lineItems);
  const categories = Object.keys(categoryTotals).sort();
  const costData = categories.map((c) => Math.round((categoryTotals[c] ?? 0) * 100) / 100);

  const donutOptions: ApexOptions = {
    chart: {
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
              formatter: () => `$${costData.reduce((a, b) => a + b, 0).toLocaleString()}`,
            },
          },
        },
      },
    },
  };

  const barOptions: ApexOptions = {
    chart: {
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
  const profitTarget = state.inputs.profitTarget ?? 0;
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
    <div className="space-y-6 bg-white p-8 text-black print:p-8">
      <header>
        <h1 className="mb-2 text-2xl font-bold">Badger Planning – Projection Dashboard</h1>
        <p className="text-sm text-gray-600">
          {state.budget && `Budget: ${state.budget.name} (${state.budget.year})`}
          {state.budget && state.scenario && " • "}
          {state.scenario && `Scenario: ${state.scenario.name}`}
        </p>
      </header>

      {/* Summary Section – matches dashboard cards */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Summary</h2>
        <p className="mb-4 text-sm text-gray-600 max-w-2xl">
          This section shows the key numbers at a glance. These figures help you understand how much
          the event costs, how much revenue you need to cover costs and hit your profit goal, and
          which ticket and staff prices might work best. All numbers are calculated from your budget
          and the assumptions below.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">Total event cost</p>
            <p className="text-xl font-bold">
              ${summary.totalCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500">Sum of all budget line items</p>
          </div>
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">Cost + profit target</p>
            <p className="text-xl font-bold">
              $
              {summary.totalWithProfitTarget.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-gray-500">Gross revenue needed to meet profit target</p>
          </div>
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">GA tickets available</p>
            <p className="text-xl font-bold">{summary.gaTicketsAvailable}</p>
            <p className="text-xs text-gray-500">
              Max capacity ({summary.maxOccupancy}) − staff ({summary.staffCount})
            </p>
          </div>
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">Attendance → tickets sold</p>
            <div className="mt-1 space-y-1 text-sm">
              {summary.attendanceBreakdown.map(({ percent, tickets }) => (
                <div key={percent} className="flex justify-between">
                  <span className="text-gray-600">{percent}%</span>
                  <span className="font-medium">{tickets} attendees</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">+ {summary.staffCount} staff</p>
          </div>
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">Lowest ticket price</p>
            <p className="text-xl font-bold">
              {summary.lowestBreakEven != null ? `$${summary.lowestBreakEven}` : "—"}
            </p>
            <p className="text-xs text-gray-500">
              To break even at ${summary.minStaffPrice} staff price
            </p>
            {summary.lowestMeetingTarget != null &&
              summary.lowestMeetingTarget !== summary.lowestBreakEven && (
                <p className="mt-1 text-xs text-gray-500">
                  ${summary.lowestMeetingTarget} to meet profit target
                </p>
              )}
          </div>
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">Day pass (gross)</p>
            <p className="text-xl font-bold">${summary.dayPassRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              {summary.dayPassesSold} passes × ${summary.dayPassPrice}
            </p>
          </div>
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">Complimentary tickets</p>
            <p className="text-xl font-bold">{summary.complimentaryTickets}</p>
            <p className="text-xs text-gray-500">Yield $0 revenue</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Revenue lost: ${summary.revenueLostToComps.toLocaleString()} (
              {summary.complimentaryTickets} × $${summary.compTicketPriceRef}/ticket)
            </p>
          </div>
          {summary.breakEvenTickets != null && (
            <div className="rounded border p-4">
              <p className="text-sm text-gray-600">Break-even attendance</p>
              <p className="text-xl font-bold">{summary.breakEvenTickets} tickets</p>
              <p className="text-xs text-gray-500">
                {summary.breakEvenPercent != null
                  ? `${Math.round(summary.breakEvenPercent)}% of capacity · `
                  : ""}
                {summary.breakEvenTicketContext}
              </p>
            </div>
          )}
          {summary.breakEvenTicketsRange != null && (
            <div className="rounded border p-4">
              <p className="text-sm text-gray-600">Break-even attendance</p>
              <p className="text-xl font-bold">
                {summary.breakEvenTicketsRange.min}–{summary.breakEvenTicketsRange.max} tickets
              </p>
              <p className="text-xs text-gray-500">{summary.breakEvenTicketContext}</p>
            </div>
          )}
          {summary.mostAccessible && (
            <div className="rounded border p-4">
              <p className="text-sm text-gray-600">Most accessible</p>
              <p className="text-xl font-bold text-green-700">
                ${summary.mostAccessible.ticketPrice} / Staff ${summary.mostAccessible.staffPrice}
              </p>
              <p className="text-xs text-gray-500">
                Lowest ticket + staff combo that&apos;s profitable.{" "}
                {summary.mostAccessible.attendancePercent}% att. = $
                {summary.mostAccessible.profit.toLocaleString()} profit.
              </p>
            </div>
          )}
          {summary.bestScenario && (
            <div className="rounded border p-4">
              <p className="text-sm text-gray-600">Best profit</p>
              <p className="text-xl font-bold text-green-700">
                ${summary.bestScenario.profit.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                ${summary.bestScenario.ticketPrice} / Staff ${summary.bestScenario.staffPrice} /{" "}
                {summary.bestScenario.attendancePercent}%
              </p>
            </div>
          )}
          {summary.worstProfitable &&
            summary.bestScenario &&
            summary.worstProfitable.profit !== summary.bestScenario.profit && (
              <div className="rounded border p-4">
                <p className="text-sm text-gray-600">Worst profitable</p>
                <p className="text-xl font-bold">
                  ${summary.worstProfitable.profit.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Lowest profit among break-even+ scenarios</p>
              </div>
            )}
          {summary.revenueMix && (
            <div className="rounded border p-4">
              <p className="text-sm text-gray-600">Revenue mix</p>
              <p className="text-sm font-medium">
                {summary.revenueMix.attendee.toFixed(0)}% attendees ·{" "}
                {summary.revenueMix.staff.toFixed(0)}% staff ·{" "}
                {summary.revenueMix.dayPass.toFixed(0)}% day pass
              </p>
              <p className="text-xs text-gray-500 mt-1">At most accessible scenario</p>
            </div>
          )}
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Scenario Inputs</h2>
        <p className="mb-4 text-sm text-gray-600 max-w-2xl">
          These are the assumptions used for all calculations in this report. Max occupancy is your
          venue capacity; staff count is how many people get discounted tickets. The profit target
          is how much money you want to make beyond covering costs. Ticket and staff prices are the
          options we test to see which combinations are profitable.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <tbody>
              <tr>
                <td className="border px-2 py-1 font-medium">Max Occupancy</td>
                <td className="border px-2 py-1">{state.inputs.maxOccupancy}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-medium">Staff Count</td>
                <td className="border px-2 py-1">{state.inputs.staffCount}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-medium">Complimentary Tickets</td>
                <td className="border px-2 py-1">{state.inputs.complimentaryTickets ?? 0}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-medium">Profit Target</td>
                <td className="border px-2 py-1">${state.inputs.profitTarget}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-medium">Ticket Prices</td>
                <td className="border px-2 py-1">
                  ${state.inputs.ticketPrices.proposedPrice1} / $
                  {state.inputs.ticketPrices.proposedPrice2} / $
                  {state.inputs.ticketPrices.proposedPrice3} (Staff: $
                  {state.inputs.ticketPrices.staffPrice1} / ${state.inputs.ticketPrices.staffPrice2}{" "}
                  / ${state.inputs.ticketPrices.staffPrice3})
                </td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-medium">Day Pass</td>
                <td className="border px-2 py-1">
                  ${state.inputs.dayPassPrice} × {state.inputs.dayPassesSold} = $
                  {(state.inputs.dayPassPrice * state.inputs.dayPassesSold).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Budget Total */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Budget Total</h2>
        <p className="mb-2 text-sm text-gray-600 max-w-2xl">
          This is the sum of all expenses in your budget—the total amount you plan to spend on the
          event.
        </p>
        <p className="text-xl font-bold">
          ${totalCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </section>

      {/* Budget Line Items */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Budget Line Items</h2>
        <p className="mb-4 text-sm text-gray-600 max-w-2xl">
          This is your full expense list—every item you plan to spend money on. Each row shows the
          item name, category, unit cost (price per item), quantity, and total (unit cost ×
          quantity). The sum equals your Budget Total above.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Category</th>
                <th className="border p-2 text-right">Unit Cost</th>
                <th className="border p-2 text-right">Qty</th>
                <th className="border p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {state.lineItems.map((li) => (
                <tr key={li.id}>
                  <td className="border p-2">{li.name}</td>
                  <td className="border p-2">{li.category}</td>
                  <td className="border p-2 text-right">${li.unitCost.toFixed(2)}</td>
                  <td className="border p-2 text-right">{li.quantity}</td>
                  <td className="border p-2 text-right">
                    ${(li.unitCost * li.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-semibold">Total: ${totalCosts.toFixed(2)}</p>
      </section>

      {/* Food Cost Breakdown */}
      {foodCost && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Food Cost Breakdown</h2>
          <p className="mb-3 text-sm text-gray-600 max-w-2xl">
            This section shows how your total food and beverage spending breaks down per person. We
            assume a 4-day event: attendees and staff each get 4 days of meals, while day-pass
            holders get 1 meal. Use these numbers to understand the cost of feeding each type of
            participant.
          </p>
          <p className="mb-4 text-sm text-gray-600">
            Total food & beverage: ${foodCost.totalFoodCost.toLocaleString()}. 4-day event.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded border p-3">
              <p className="text-xs text-gray-600">Per attendee (4 days)</p>
              <p className="font-semibold">${foodCost.foodCostPerAttendee.toFixed(2)}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-xs text-gray-600">Per day pass</p>
              <p className="font-semibold">${foodCost.foodCostPerDayPass.toFixed(2)}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-xs text-gray-600">Cost per day</p>
              <p className="font-semibold">${foodCost.foodCostPerDay.toFixed(2)}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-xs text-gray-600">Per staff (4 days)</p>
              <p className="font-semibold">${foodCost.foodCostPerStaff.toFixed(2)}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-xs text-gray-600">Cost per meal</p>
              <p className="font-semibold">${foodCost.costPerMeal.toFixed(2)}</p>
            </div>
          </div>
        </section>
      )}

      {/* Cost Charts */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Cost by Category</h2>
        <p className="mb-4 text-sm text-gray-600 max-w-2xl">
          These charts show where your money goes. The donut (left) shows each category as a slice
          of the total. The bar chart (right) shows the same breakdown in dollar amounts. Use these
          to see which areas—e.g. venue, food, equipment—absorb the most of your budget.
        </p>
        <div className="cost-charts-print-stack grid gap-6 sm:grid-cols-2 print:grid-cols-1 print:gap-8">
          <div className="break-inside-avoid">
            <h3 className="mb-2 text-sm font-medium">Donut</h3>
            <div className="h-[300px]">
              <Chart options={donutOptions} series={costData} type="donut" height={280} />
            </div>
          </div>
          <div className="break-inside-avoid">
            <h3 className="mb-2 text-sm font-medium">Bar</h3>
            <div className="h-[300px]">
              <Chart
                options={barOptions}
                series={[{ name: "Cost", data: costData }]}
                type="bar"
                height={Math.max(200, categories.length * 40)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Profit Heatmap */}
      {metrics.length > 0 && (
        <section className="break-before-page">
          <h2 className="mb-2 text-lg font-semibold">Profit by Scenario Heatmap</h2>
          <p className="mb-4 text-sm text-gray-600 max-w-2xl">
            This heatmap shows profit (or loss) for different combinations of ticket price, staff
            price, and attendance level. Each cell = one scenario. Green means you meet your profit
            target; orange means you make money but below target; red means a loss. Rows =
            attendance levels; columns = ticket/staff price pairs. Use it to quickly spot which
            pricing works at different turnout levels.
          </p>
          <div className="h-[320px]">
            <Chart
              options={heatmapOptions}
              series={heatmapSeries}
              type="heatmap"
              height={Math.max(400, attendanceLevels.length * 36)}
            />
          </div>
        </section>
      )}

      {/* Scenario Matrix – Tables per Attendance Level */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Scenario Matrix</h2>
        <p className="mb-4 text-sm text-gray-600 max-w-2xl">
          This section shows the detailed numbers behind each scenario. Each table covers one
          attendance level (e.g. 50% full). Gross revenue = money from tickets before costs; Net
          revenue (profit) = Gross minus all expenses. Profit margin = profit as % of revenue. Cost
          coverage = how many times revenue covers costs (1× = break-even). Charts below each table
          compare scenarios side by side.
        </p>
        <p className="mb-6 text-sm text-gray-600">
          Gross = ticket income; Net = Gross − costs. One table per attendance level.
        </p>
        {scenarioMatrix.attendanceLevels
          .filter((pct) => pct >= 50)
          .map((pct) => {
            const tableMetrics = (scenarioMatrix.byAttendance[pct] ?? []).slice().sort((a, b) => {
              if (a.profit !== b.profit) return a.profit - b.profit;
              if (a.ticketPrice !== b.ticketPrice) return a.ticketPrice - b.ticketPrice;
              return a.staffPrice - b.staffPrice;
            });
            const showCharts = tableMetrics.length > 1 && tableMetrics.length <= 12;
            const chartLabels = tableMetrics.map((m) => `$${m.ticketPrice}/$${m.staffPrice}`);
            return (
              <div key={pct} className="mb-8 break-inside-avoid">
                <h3 className="mb-2 text-base font-semibold">{pct}% Attendance</h3>
                <p className="mb-2 text-xs text-gray-600">{tableMetrics[0]?.attendees} attendees</p>
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Ticket Cost</th>
                        <th className="border p-2 text-left">Staff Cost</th>
                        <th className="border p-2 text-left">Attendance</th>
                        <th className="border p-2 text-right">Gross Revenue</th>
                        <th className="border p-2 text-right">Net Revenue</th>
                        <th className="border p-2 text-right">Profit Margin</th>
                        <th className="border p-2 text-right">Profit/Attendee</th>
                        <th className="border p-2 text-right">Cost Coverage</th>
                        <th className="border p-2 text-right">Rev/Ticket</th>
                        <th className="border p-2 text-right">Attendee %</th>
                        <th className="border p-2 text-right">Break-ev Att %</th>
                        <th className="border p-2 text-right">Target Cov %</th>
                        <th className="border p-2 text-right">Meets Target</th>
                        <th className="border p-2 text-right">Cost/Person</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableMetrics.map((m) => (
                        <tr key={m.scenarioKey} className={m.profit < 0 ? "bg-red-50" : ""}>
                          <td className="border p-2">${m.ticketPrice}</td>
                          <td className="border p-2">${m.staffPrice}</td>
                          <td className="border p-2">{m.attendancePercent}%</td>
                          <td className="border p-2 text-right">${m.revenue.toLocaleString()}</td>
                          <td
                            className={`border p-2 text-right font-medium ${
                              m.profit >= 0 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            ${m.profit.toLocaleString()}
                          </td>
                          <td className="border p-2 text-right">{m.profitMargin.toFixed(1)}%</td>
                          <td className="border p-2 text-right">
                            ${m.profitPerAttendee.toFixed(0)}
                          </td>
                          <td className="border p-2 text-right">
                            {m.costCoverageRatio.toFixed(2)}×
                          </td>
                          <td className="border p-2 text-right">
                            ${m.avgRevenuePerTicket.toFixed(0)}
                          </td>
                          <td className="border p-2 text-right">
                            {m.revenueMixAttendee.toFixed(0)}%
                          </td>
                          <td className="border p-2 text-right">
                            {m.breakEvenAttendancePercent != null
                              ? `${Math.round(m.breakEvenAttendancePercent)}%`
                              : "—"}
                          </td>
                          <td className="border p-2 text-right">
                            {m.profitTargetCoverage != null
                              ? `${m.profitTargetCoverage.toFixed(0)}%`
                              : "—"}
                          </td>
                          <td className="border p-2 text-right">
                            {m.profitVsBreakEven >= 0 ? "Yes" : "No"}
                          </td>
                          <td className="border p-2 text-right">${m.costPerAttendee.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {showCharts && (
                  <div className="mt-4 grid grid-cols-2 gap-4 print:grid-cols-2">
                    <div>
                      <h4 className="mb-1 text-xs font-medium">ROI</h4>
                      <div className="h-[200px]">
                        <Chart
                          options={{
                            chart: { type: "bar", fontFamily: "inherit", background: "#fff" },
                            theme: { mode: "light" },
                            colors: ["#22c55e"],
                            plotOptions: {
                              bar: { horizontal: false, columnWidth: "60%", borderRadius: 4 },
                            },
                            dataLabels: { enabled: false },
                            xaxis: {
                              categories: chartLabels,
                              labels: { rotate: -45, style: { fontSize: "9px" } },
                            },
                            yaxis: {
                              labels: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
                            },
                            legend: { show: false },
                          }}
                          series={[
                            {
                              name: "ROI",
                              data: tableMetrics.map((m) => Math.round(m.roi * 100) / 100),
                            },
                          ]}
                          type="bar"
                          height={180}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-1 text-xs font-medium">Net Revenue</h4>
                      <div className="h-[200px]">
                        <Chart
                          options={{
                            chart: { type: "bar", fontFamily: "inherit", background: "#fff" },
                            theme: { mode: "light" },
                            colors: tableMetrics.map((m) =>
                              m.profit >= 0 ? "#22c55e" : "#ef4444",
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
                            ...(typeof state.inputs.profitTarget === "number" &&
                              state.inputs.profitTarget > 0 && {
                                annotations: {
                                  yaxis: [
                                    {
                                      y: state.inputs.profitTarget,
                                      borderColor: "#a78bfa",
                                      strokeDashArray: 4,
                                    },
                                  ],
                                },
                              }),
                          }}
                          series={[{ name: "Profit", data: tableMetrics.map((m) => m.profit) }]}
                          type="bar"
                          height={180}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-1 text-xs font-medium">Gross Revenue</h4>
                      <div className="h-[200px]">
                        <Chart
                          options={{
                            chart: { type: "bar", fontFamily: "inherit", background: "#fff" },
                            theme: { mode: "light" },
                            colors: ["#3b82f6"],
                            plotOptions: {
                              bar: { horizontal: false, columnWidth: "60%", borderRadius: 4 },
                            },
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
                          height={180}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-1 text-xs font-medium">Profit Margin</h4>
                      <div className="h-[200px]">
                        <Chart
                          options={{
                            chart: { type: "bar", fontFamily: "inherit", background: "#fff" },
                            theme: { mode: "light" },
                            colors: tableMetrics.map((m) =>
                              m.profitMargin >= 0 ? "#22c55e" : "#ef4444",
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
                              formatter: (v: number) => `${Number(v).toFixed(1)}%`,
                            },
                            xaxis: {
                              categories: chartLabels,
                              labels: { rotate: -45, style: { fontSize: "9px" } },
                            },
                            yaxis: {
                              labels: { formatter: (v: number) => `${Number(v).toFixed(0)}%` },
                            },
                            legend: { show: false },
                          }}
                          series={[
                            {
                              name: "Profit Margin",
                              data: tableMetrics.map((m) => Math.round(m.profitMargin * 10) / 10),
                            },
                          ]}
                          type="bar"
                          height={180}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-1 text-xs font-medium">Profit per Attendee</h4>
                      <div className="h-[200px]">
                        <Chart
                          options={{
                            chart: { type: "bar", fontFamily: "inherit", background: "#fff" },
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
                              data: tableMetrics.map(
                                (m) => Math.round(m.profitPerAttendee * 100) / 100,
                              ),
                            },
                          ]}
                          type="bar"
                          height={180}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-1 text-xs font-medium">Cost Coverage</h4>
                      <div className="h-[200px]">
                        <Chart
                          options={{
                            chart: { type: "bar", fontFamily: "inherit", background: "#fff" },
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
                            yaxis: {
                              labels: { formatter: (v: number) => `${Number(v).toFixed(1)}×` },
                            },
                            legend: { show: false },
                            annotations: {
                              yaxis: [{ y: 1, borderColor: "#a78bfa", strokeDashArray: 4 }],
                            },
                          }}
                          series={[
                            {
                              name: "Cost Coverage",
                              data: tableMetrics.map(
                                (m) => Math.round(m.costCoverageRatio * 100) / 100,
                              ),
                            },
                          ]}
                          type="bar"
                          height={180}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </section>
    </div>
  );
}
