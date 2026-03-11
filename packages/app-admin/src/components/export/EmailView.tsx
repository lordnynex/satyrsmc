import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExportCharts } from "./ExportCharts";
import type { Inputs, LineItem, ScenarioMetrics } from "@satyrsmc/shared/client";
import {
  computeExportSummary,
  computeExportFoodCost,
  computeExportScenarioMatrix,
} from "@/export/exportData";

interface EmailViewProps {
  state: {
    inputs: Inputs;
    lineItems: LineItem[];
    budget?: { name: string; year: number } | null;
    scenario?: { name: string } | null;
  };
  metrics: ScenarioMetrics[];
}

export function EmailView({ state, metrics }: EmailViewProps) {
  const totalCosts = state.lineItems.reduce(
    (sum, li) => sum + li.unitCost * li.quantity,
    0
  );
  const [chartImages, setChartImages] = useState<Record<string, string> | null>(
    null
  );
  const [html, setHtml] = useState<string>("");

  const summary = computeExportSummary(state.inputs, state.lineItems, metrics);
  const foodCost = computeExportFoodCost(state.inputs, state.lineItems);
  const scenarioMatrix = computeExportScenarioMatrix(metrics);

  useEffect(() => {
    if (!chartImages) return;

    const budgetScenario =
      state.budget && state.scenario
        ? `Budget: ${state.budget.name} (${state.budget.year}) • Scenario: ${state.scenario.name}`
        : state.budget
          ? `Budget: ${state.budget.name} (${state.budget.year})`
          : state.scenario
            ? `Scenario: ${state.scenario.name}`
            : "";

    const chartImg = (key: string) =>
      chartImages[key]
        ? `<img src="${chartImages[key]}" alt="${key}" style="max-width: 100%; width: 100%; height: auto; margin: 8px 0; border: 1px solid #eee; border-radius: 6px;" />`
        : "";

    const scenarioChartTypes = ["ROI", "PnL", "Revenue", "ProfitMargin", "ProfitPerAttendee", "CostCoverage"] as const;
    const scenarioTablesHtml = scenarioMatrix.attendanceLevels
      .filter((pct) => pct >= 50)
      .map((pct) => {
        const tableMetrics = (scenarioMatrix.byAttendance[pct] ?? [])
          .slice()
          .sort((a, b) => {
            if (a.profit !== b.profit) return a.profit - b.profit;
            if (a.ticketPrice !== b.ticketPrice) return a.ticketPrice - b.ticketPrice;
            return a.staffPrice - b.staffPrice;
          });
        const showCharts = tableMetrics.length > 1 && tableMetrics.length <= 12;
        const rows = tableMetrics
          .map(
            (m) =>
              `<tr style="${m.profit < 0 ? "background: #fef2f2;" : ""}">
                <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 11px;">$${m.ticketPrice}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 11px;">$${m.staffPrice}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 11px;">${m.attendancePercent}%</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">$${m.revenue.toLocaleString()}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; color: ${m.profit >= 0 ? "#16a34a" : "#dc2626"}; font-weight: 600; font-size: 11px;">$${m.profit.toLocaleString()}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">${m.profitMargin.toFixed(1)}%</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">$${m.profitPerAttendee.toFixed(0)}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">${m.costCoverageRatio.toFixed(2)}×</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">$${m.avgRevenuePerTicket.toFixed(0)}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">${m.revenueMixAttendee.toFixed(0)}%</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">${m.breakEvenAttendancePercent != null ? Math.round(m.breakEvenAttendancePercent) + "%" : "—"}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">${m.profitTargetCoverage != null ? m.profitTargetCoverage.toFixed(0) + "%" : "—"}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">${m.profitVsBreakEven >= 0 ? "Yes" : "No"}</td>
                <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">$${m.costPerAttendee.toFixed(0)}</td>
              </tr>`
          )
          .join("");
        const chartLabels: Record<string, string> = {
          ROI: "ROI",
          PnL: "Net Revenue",
          Revenue: "Gross Revenue",
          ProfitMargin: "Profit Margin",
          ProfitPerAttendee: "Profit per Attendee",
          CostCoverage: "Cost Coverage",
        };
        const chartsHtml = showCharts
          ? `<div style="margin-top: 16px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            ${scenarioChartTypes
              .map(
                (t) =>
                  `<div>
                    <p style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">${chartLabels[t]}</p>
                    ${chartImg(`scenario-${pct}-${t}`)}
                  </div>`
              )
              .join("")}
          </div>`
          : "";
        return `
          <h3 style="font-size: 16px; margin-top: 24px; margin-bottom: 8px;">${pct}% Attendance</h3>
          <p style="color: #666; font-size: 12px; margin-bottom: 8px;">${tableMetrics[0]?.attendees} attendees</p>
          <div style="overflow-x: auto; max-width: 100%; margin-bottom: 16px; -webkit-overflow-scrolling: touch;">
            <table style="border-collapse: collapse; margin-bottom: 0; font-size: 11px; min-width: 650px;">
            <tr style="background: #f5f5f5;">
              <th style="padding: 6px; text-align: left; font-size: 11px;">Ticket</th>
              <th style="padding: 6px; text-align: left; font-size: 11px;">Staff</th>
              <th style="padding: 6px; text-align: left; font-size: 11px;">Att %</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">Gross</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">Net</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">Margin %</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">P/Att</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">Cov</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">Rev/Tkt</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">Att %</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">BE %</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">Tgt %</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">Target</th>
              <th style="padding: 6px; text-align: right; font-size: 11px;">$/Person</th>
            </tr>
            ${rows}
          </table>
          </div>
          ${chartsHtml}`;
      })
      .join("");

    const foodCostHtml = foodCost
      ? `
      <h2 style="font-size: 18px; margin-top: 24px; margin-bottom: 8px;">Food Cost Breakdown</h2>
      <p style="color: #666; font-size: 14px; margin-bottom: 12px; max-width: 600px;">This section shows how your total food and beverage spending breaks down per person. We assume a 4-day event: attendees and staff each get 4 days of meals, while day-pass holders get 1 meal. Use these numbers to understand the cost of feeding each type of participant.</p>
      <p style="color: #666; margin-bottom: 12px;">Total food & beverage: $${foodCost.totalFoodCost.toLocaleString()}. 4-day event.</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Per attendee (4 days)</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">$${foodCost.foodCostPerAttendee.toFixed(2)}</td></tr>
        <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Per day pass</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">$${foodCost.foodCostPerDayPass.toFixed(2)}</td></tr>
        <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Cost per day</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">$${foodCost.foodCostPerDay.toFixed(2)}</td></tr>
        <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Per staff (4 days)</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">$${foodCost.foodCostPerStaff.toFixed(2)}</td></tr>
        <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Cost per meal</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">$${foodCost.costPerMeal.toFixed(2)}</td></tr>
      </table>`
      : "";

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Badger Planning – Projection Dashboard</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333; max-width: 700px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin-bottom: 8px;">Badger Planning – Projection Dashboard</h1>
  ${budgetScenario ? `<p style="color: #666; margin-bottom: 24px;">${budgetScenario}</p>` : ""}

  <h2 style="font-size: 18px; margin-top: 24px; margin-bottom: 8px;">Summary</h2>
  <p style="color: #666; font-size: 14px; margin-bottom: 16px; max-width: 600px;">This section shows the key numbers at a glance. These figures help you understand how much the event costs, how much revenue you need to cover costs and hit your profit goal, and which ticket and staff prices might work best. All numbers are calculated from your budget and the assumptions below.</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Total event cost</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">$${summary.totalCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Cost + profit target</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">$${summary.totalWithProfitTarget.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">GA tickets available</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">${summary.gaTicketsAvailable} (max ${summary.maxOccupancy} − ${summary.staffCount} staff)</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Attendance → tickets sold</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">${summary.attendanceBreakdown.map((b) => `${b.percent}%: ${b.tickets}`).join(" / ")} attendees + ${summary.staffCount} staff</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Lowest ticket price (break even)</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">${summary.lowestBreakEven != null ? "$" + summary.lowestBreakEven + " at $" + summary.minStaffPrice + " staff" : "—"}</td></tr>
    ${summary.lowestMeetingTarget != null && summary.lowestMeetingTarget !== summary.lowestBreakEven ? `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">To meet profit target</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">$${summary.lowestMeetingTarget}</td></tr>` : ""}
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Day pass (gross)</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">$${summary.dayPassRevenue.toLocaleString()} (${summary.dayPassesSold} × $${summary.dayPassPrice})</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Complimentary tickets</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">${summary.complimentaryTickets} (yield $0 · revenue lost: $${summary.revenueLostToComps.toLocaleString()})</td></tr>
    ${summary.breakEvenTickets != null ? `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Break-even attendance</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">${summary.breakEvenTickets} tickets${summary.breakEvenPercent != null ? ` (${Math.round(summary.breakEvenPercent)}% of capacity)` : ""}</td></tr>` : ""}
    ${summary.breakEvenTicketsRange != null ? `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Break-even attendance</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">${summary.breakEvenTicketsRange.min}–${summary.breakEvenTicketsRange.max} tickets</td></tr>` : ""}
    ${summary.mostAccessible ? `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Most accessible</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right; color: #16a34a;">$${summary.mostAccessible.ticketPrice} / Staff $${summary.mostAccessible.staffPrice} (${summary.mostAccessible.attendancePercent}% att. = $${summary.mostAccessible.profit.toLocaleString()} profit)</td></tr>` : ""}
    ${summary.bestScenario ? `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Best profit</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right; color: #16a34a;">$${summary.bestScenario.profit.toLocaleString()} ($${summary.bestScenario.ticketPrice} / Staff $${summary.bestScenario.staffPrice} / ${summary.bestScenario.attendancePercent}%)</td></tr>` : ""}
    ${summary.worstProfitable && summary.bestScenario && summary.worstProfitable.profit !== summary.bestScenario.profit ? `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Worst profitable</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">$${summary.worstProfitable.profit.toLocaleString()}</td></tr>` : ""}
    ${summary.revenueMix ? `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Revenue mix</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">${summary.revenueMix.attendee.toFixed(0)}% attendees · ${summary.revenueMix.staff.toFixed(0)}% staff · ${summary.revenueMix.dayPass.toFixed(0)}% day pass</td></tr>` : ""}
  </table>

  <h2 style="font-size: 18px; margin-top: 24px; margin-bottom: 8px;">Scenario Inputs</h2>
  <p style="color: #666; font-size: 14px; margin-bottom: 16px; max-width: 600px;">These are the assumptions used for all calculations in this report. Max occupancy is your venue capacity; staff count is how many people get discounted tickets. The profit target is how much money you want to make beyond covering costs. Ticket and staff prices are the options we test to see which combinations are profitable.</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Max Occupancy</td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${state.inputs.maxOccupancy}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Staff Count</td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${state.inputs.staffCount}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Complimentary Tickets</td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${state.inputs.complimentaryTickets ?? 0}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Profit Target</td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">$${state.inputs.profitTarget}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Ticket Prices</td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">$${state.inputs.ticketPrices.proposedPrice1} / $${state.inputs.ticketPrices.proposedPrice2} / $${state.inputs.ticketPrices.proposedPrice3} (Staff: $${state.inputs.ticketPrices.staffPrice1} / $${state.inputs.ticketPrices.staffPrice2} / $${state.inputs.ticketPrices.staffPrice3})</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Day Pass</td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">$${state.inputs.dayPassPrice} × ${state.inputs.dayPassesSold} = $${(state.inputs.dayPassPrice * state.inputs.dayPassesSold).toLocaleString()}</td></tr>
  </table>

  <h2 style="font-size: 18px; margin-top: 24px; margin-bottom: 8px;">Budget Total</h2>
  <p style="color: #666; font-size: 14px; margin-bottom: 8px; max-width: 600px;">This is the sum of all expenses in your budget—the total amount you plan to spend on the event.</p>
  <p style="font-size: 18px; font-weight: bold;">$${totalCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>

  <h2 style="font-size: 18px; margin-top: 24px; margin-bottom: 8px;">Budget Line Items</h2>
  <p style="color: #666; font-size: 14px; margin-bottom: 16px; max-width: 600px;">This is your full expense list—every item you plan to spend money on. Each row shows the item name, category, unit cost (price per item), quantity, and total. The sum equals your Budget Total above.</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr style="background: #f5f5f5;">
      <th style="padding: 8px; text-align: left;">Name</th>
      <th style="padding: 8px; text-align: left;">Category</th>
      <th style="padding: 8px; text-align: right;">Unit Cost</th>
      <th style="padding: 8px; text-align: right;">Qty</th>
      <th style="padding: 8px; text-align: right;">Total</th>
    </tr>
    ${state.lineItems
      .map(
        (li) =>
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${li.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${li.category}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${li.unitCost.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${li.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(li.unitCost * li.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join("")}
  </table>

  ${foodCostHtml}

  <h2 style="font-size: 18px; margin-top: 24px; margin-bottom: 8px;">Cost by Category</h2>
  <p style="color: #666; font-size: 14px; margin-bottom: 16px; max-width: 600px;">These charts show where your money goes. The donut shows each category as a slice of the total. The bar chart shows the same breakdown in dollar amounts. Use these to see which areas—e.g. venue, food, equipment—absorb the most of your budget.</p>
  ${chartImg("costDonut")}
  ${chartImg("costBar")}

  <h2 style="font-size: 18px; margin-top: 24px; margin-bottom: 8px;">Profit by Scenario Heatmap</h2>
  <p style="color: #666; font-size: 14px; margin-bottom: 16px; max-width: 600px;">This heatmap shows profit (or loss) for different combinations of ticket price, staff price, and attendance level. Each cell = one scenario. Green means you meet your profit target; orange means you make money but below target; red means a loss. Use it to quickly spot which pricing works at different turnout levels.</p>
  ${chartImg("heatmap")}

  <h2 style="font-size: 18px; margin-top: 24px; margin-bottom: 8px;">Scenario Matrix</h2>
  <p style="color: #666; font-size: 14px; margin-bottom: 12px; max-width: 600px;">This section shows the detailed numbers behind each scenario. Each table covers one attendance level (e.g. 50% full). Gross revenue = money from tickets before costs; Net revenue (profit) = Gross minus all expenses. Profit margin = profit as % of revenue. Cost coverage = how many times revenue covers costs (1× = break-even). Charts below each table compare scenarios side by side.</p>
  <p style="color: #666; margin-bottom: 12px;">Gross = ticket income; Net = Gross − costs. One table per attendance level.</p>
  ${scenarioTablesHtml}

  <p style="margin-top: 24px; color: #666; font-size: 12px;">Generated by Badger Planning Dashboard</p>
</body>
</html>`;

    setHtml(fullHtml);
  }, [chartImages, state, summary, foodCost, scenarioMatrix, totalCosts]);

  const handleChartsReady = (images: Record<string, string>) => {
    setChartImages(images);
  };

  return (
    <div className="space-y-4">
      <ExportCharts
        lineItems={state.lineItems}
        metrics={metrics}
        profitTarget={state.inputs.profitTarget}
        onChartsReady={handleChartsReady}
      />
      {!chartImages && (
        <p className="text-muted-foreground text-sm">
          Generating chart images… This may take a few seconds.
        </p>
      )}
      {html && (
        <>
          <p className="text-muted-foreground text-sm">
            Copy the HTML below or open in a new tab to share via email. Charts
            are embedded as base64 images.
          </p>
          <Textarea
            readOnly
            className="h-64 font-mono text-xs"
            value={html}
          />
          <Button
            type="button"
            onClick={() => {
              const w = window.open("", "_blank");
              if (w) {
                w.document.write(html);
                w.document.close();
              }
            }}
          >
            Open in new tab
          </Button>
        </>
      )}
    </div>
  );
}
