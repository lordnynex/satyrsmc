import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAppState } from "@/state/AppState";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

interface SummarySectionProps {
  metrics: ScenarioMetrics[];
  filteredMetrics: ScenarioMetrics[];
}

export function SummarySection({ metrics: _metrics, filteredMetrics }: SummarySectionProps) {
  const { getInputs, getLineItems } = useAppState();
  const inputs = getInputs();
  const lineItems = getLineItems();
  const totalCosts = lineItems.reduce((sum, li) => sum + li.unitCost * li.quantity, 0);
  const totalWithProfitTarget = totalCosts + inputs.profitTarget;
  const maxOccupancy = inputs.maxOccupancy;
  const staffCount = inputs.staffCount;

  const _attendanceBreakdown = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((percent) => ({
    percent,
    tickets: Math.round(maxOccupancy * (percent / 100)),
  }));

  const profitableScenarios = filteredMetrics.filter((m) => m.profit >= 0);
  const meetingTargetScenarios = filteredMetrics.filter((m) => m.profitVsBreakEven >= 0);

  const minStaffPrice =
    filteredMetrics.length > 0 ? Math.min(...filteredMetrics.map((m) => m.staffPrice)) : 0;
  const atLowestStaff = (m: ScenarioMetrics) => m.staffPrice === minStaffPrice;

  const lowestBreakEven =
    profitableScenarios.filter(atLowestStaff).length > 0
      ? Math.min(...profitableScenarios.filter(atLowestStaff).map((m) => m.ticketPrice))
      : profitableScenarios.length > 0
        ? Math.min(...profitableScenarios.map((m) => m.ticketPrice))
        : null;
  const lowestMeetingTarget =
    meetingTargetScenarios.filter(atLowestStaff).length > 0
      ? Math.min(...meetingTargetScenarios.filter(atLowestStaff).map((m) => m.ticketPrice))
      : meetingTargetScenarios.length > 0
        ? Math.min(...meetingTargetScenarios.map((m) => m.ticketPrice))
        : null;

  const dayPassRevenue = (inputs.dayPassPrice ?? 0) * (inputs.dayPassesSold ?? 0);

  const mostAccessible =
    profitableScenarios.length > 0
      ? [...profitableScenarios].sort((a, b) => {
          if (a.ticketPrice !== b.ticketPrice) return a.ticketPrice - b.ticketPrice;
          return a.staffPrice - b.staffPrice;
        })[0]
      : null;

  const breakEvenAtMostAccessible = mostAccessible?.breakEvenAttendancePercent;
  const breakEvenTicketsAtMostAccessible = mostAccessible?.breakEvenTotalAttendees;

  const breakEvenAttendances = filteredMetrics
    .filter(
      (m) =>
        m.breakEvenAttendancePercent != null &&
        m.breakEvenAttendancePercent >= 0 &&
        m.breakEvenAttendancePercent <= 100,
    )
    .map((m) => m.breakEvenAttendancePercent!);
  const breakEvenMin = breakEvenAttendances.length > 0 ? Math.min(...breakEvenAttendances) : null;
  const _breakEvenMax = breakEvenAttendances.length > 0 ? Math.max(...breakEvenAttendances) : null;

  const breakEvenTicketCounts = filteredMetrics
    .filter(
      (m) =>
        m.breakEvenTotalAttendees != null &&
        m.breakEvenAttendancePercent != null &&
        m.breakEvenAttendancePercent >= 0 &&
        m.breakEvenAttendancePercent <= 100,
    )
    .map((m) => m.breakEvenTotalAttendees!);
  const breakEvenTicketsMin =
    breakEvenTicketCounts.length > 0 ? Math.min(...breakEvenTicketCounts) : null;
  const breakEvenTicketsMax =
    breakEvenTicketCounts.length > 0 ? Math.max(...breakEvenTicketCounts) : null;

  const complimentaryTickets = inputs.complimentaryTickets ?? 0;
  const gaTicketsAvailable = Math.max(0, maxOccupancy - staffCount);
  const revenueLostToComps = mostAccessible
    ? complimentaryTickets * mostAccessible.ticketPrice
    : complimentaryTickets * (inputs.ticketPrices.proposedPrice1 || 0);

  const bestScenario =
    filteredMetrics.length > 0
      ? filteredMetrics.reduce((a, b) => (b.profit > a.profit ? b : a))
      : null;
  const worstProfitable =
    profitableScenarios.length > 0
      ? profitableScenarios.reduce((a, b) => (b.profit < a.profit ? b : a))
      : null;

  const revenueMixScenario =
    mostAccessible ?? bestScenario ?? filteredMetrics.find((m) => m.attendancePercent === 100);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Total event cost</h3>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            ${totalCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-muted-foreground text-xs mt-1">Sum of all budget line items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Cost + profit target</h3>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            ${totalWithProfitTarget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Gross revenue needed to meet profit target
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">GA tickets available</h3>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{gaTicketsAvailable}</p>
          <p className="text-muted-foreground text-xs mt-1">
            Max capacity ({maxOccupancy}) − staff ({staffCount})
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Attendance → tickets sold</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            {([25, 50, 75, 100] as const).map((percent) => {
              const tickets = Math.round(maxOccupancy * (percent / 100));
              const lookupPct = percent === 25 ? 20 : percent === 75 ? 70 : percent;
              const atLevel = filteredMetrics.filter((m) => m.attendancePercent === lookupPct);
              const mostAccessibleAtLevel =
                atLevel.length > 0
                  ? [...atLevel].sort((a, b) => {
                      if (a.ticketPrice !== b.ticketPrice) return a.ticketPrice - b.ticketPrice;
                      return a.staffPrice - b.staffPrice;
                    })[0]
                  : null;
              const textColor = !mostAccessibleAtLevel
                ? "text-muted-foreground"
                : mostAccessibleAtLevel.profit < 0
                  ? "text-red-600"
                  : (inputs.profitTarget ?? 0) > 0 && mostAccessibleAtLevel.profitVsBreakEven < 0
                    ? "text-orange-600"
                    : "text-green-600";
              return (
                <div key={percent} className={`flex justify-between ${textColor}`}>
                  <span>{percent}%</span>
                  <span className="font-medium">{tickets} attendees</span>
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground text-xs mt-2">+ {staffCount} staff</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Lowest ticket price</h3>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {lowestBreakEven != null ? `$${lowestBreakEven}` : "—"}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            To break even at ${minStaffPrice} staff price
          </p>
          {lowestMeetingTarget != null && lowestMeetingTarget !== lowestBreakEven && (
            <p className="text-muted-foreground text-xs mt-1">
              ${lowestMeetingTarget} to meet profit target
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Day pass (gross)</h3>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${dayPassRevenue.toLocaleString()}</p>
          <p className="text-muted-foreground text-xs mt-1">
            {inputs.dayPassesSold} passes × ${inputs.dayPassPrice}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Complimentary tickets</h3>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{complimentaryTickets}</p>
          <p className="text-muted-foreground text-xs mt-1">Yield $0 revenue</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Revenue lost: ${revenueLostToComps.toLocaleString()} ({complimentaryTickets} ×{" "}
            {mostAccessible
              ? `$${mostAccessible.ticketPrice}`
              : `$${inputs.ticketPrices.proposedPrice1}`}
            /ticket)
          </p>
        </CardContent>
      </Card>

      {(breakEvenMin != null ||
        (mostAccessible &&
          breakEvenAtMostAccessible != null &&
          breakEvenAtMostAccessible <= 100)) && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Break-even attendance</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {mostAccessible &&
              breakEvenTicketsAtMostAccessible != null &&
              breakEvenAtMostAccessible != null &&
              breakEvenAtMostAccessible <= 100
                ? `${breakEvenTicketsAtMostAccessible} tickets`
                : breakEvenTicketsMin != null && breakEvenTicketsMax != null
                  ? breakEvenTicketsMin === breakEvenTicketsMax
                    ? `${breakEvenTicketsMin} tickets`
                    : `${breakEvenTicketsMin}–${breakEvenTicketsMax} tickets`
                  : "—"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {mostAccessible &&
              breakEvenAtMostAccessible != null &&
              breakEvenAtMostAccessible <= 100
                ? `${Math.round(breakEvenAtMostAccessible)}% of capacity · At $${mostAccessible.ticketPrice} ticket / $${mostAccessible.staffPrice} staff`
                : "Total attendees (paid + comp) needed to break even"}
            </p>
          </CardContent>
        </Card>
      )}

      {mostAccessible && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Most accessible</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${mostAccessible.ticketPrice} / Staff ${mostAccessible.staffPrice}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Lowest ticket + staff combo that&apos;s profitable. {mostAccessible.attendancePercent}
              % att. = ${mostAccessible.profit.toLocaleString()} profit.
            </p>
          </CardContent>
        </Card>
      )}

      {bestScenario && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Best profit</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${bestScenario.profit.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              ${bestScenario.ticketPrice} / Staff ${bestScenario.staffPrice} /{" "}
              {bestScenario.attendancePercent}%
            </p>
          </CardContent>
        </Card>
      )}

      {worstProfitable && worstProfitable !== bestScenario && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Worst profitable</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${worstProfitable.profit.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs mt-1">
              Lowest profit among break-even+ scenarios
            </p>
          </CardContent>
        </Card>
      )}

      {revenueMixScenario && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Revenue mix</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="font-medium">
                {revenueMixScenario.revenueMixAttendee.toFixed(0)}%
              </span>{" "}
              attendees
              {" · "}
              <span className="font-medium">
                {revenueMixScenario.revenueMixStaff.toFixed(0)}%
              </span>{" "}
              staff
              {" · "}
              <span className="font-medium">
                {revenueMixScenario.revenueMixDayPass.toFixed(0)}%
              </span>{" "}
              day pass
            </p>
            <p className="text-muted-foreground text-xs mt-1">At most accessible scenario</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
