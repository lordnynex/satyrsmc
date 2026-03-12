import type { Inputs, LineItem, ScenarioMetrics } from "../client/budget-state";

const ATTENDANCE_MULTIPLIERS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] as const;

export function computeScenarioMetrics(inputs: Inputs, lineItems: LineItem[]): ScenarioMetrics[] {
  const totalCosts = lineItems.reduce((sum, li) => sum + li.unitCost * li.quantity, 0);
  const totalCostsWithProfitTarget = totalCosts + inputs.profitTarget;

  const attendeePrices = [
    inputs.ticketPrices.proposedPrice1,
    inputs.ticketPrices.proposedPrice2,
    inputs.ticketPrices.proposedPrice3,
  ];
  const staffPrices = [
    inputs.ticketPrices.staffPrice1,
    inputs.ticketPrices.staffPrice2,
    inputs.ticketPrices.staffPrice3,
  ];
  const staffCount = inputs.staffCount;
  const maxOccupancy = inputs.maxOccupancy;
  const complimentaryTickets = inputs.complimentaryTickets ?? 0;
  const dayPassRevenue = (inputs.dayPassPrice ?? 0) * (inputs.dayPassesSold ?? 0);

  const results: ScenarioMetrics[] = [];

  for (const mult of ATTENDANCE_MULTIPLIERS) {
    const attendees = Math.round(maxOccupancy * mult);
    const paidAttendees = Math.max(0, attendees - complimentaryTickets);
    for (const ticketPrice of attendeePrices) {
      for (const staffPrice of staffPrices) {
        if (staffPrice > ticketPrice) continue;
        const attendeeRevenue = paidAttendees * ticketPrice;
        const staffRevenue = staffCount * staffPrice;
        const revenue = attendeeRevenue + staffRevenue + dayPassRevenue;
        const profit = revenue - totalCosts;
        const profitVsBreakEven = revenue - totalCostsWithProfitTarget;
        const totalPeople = attendees + staffCount;
        const roi = totalCosts > 0 ? profit / totalCosts : 0;
        const costPerAttendee = totalPeople > 0 ? totalCosts / totalPeople : 0;

        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
        const profitPerAttendee = attendees > 0 ? profit / attendees : 0;
        const avgRevenuePerTicket = totalPeople > 0 ? revenue / totalPeople : 0;
        const costCoverageRatio = totalCosts > 0 ? revenue / totalCosts : 0;

        const revenueMixAttendee = revenue > 0 ? (attendeeRevenue / revenue) * 100 : 0;
        const revenueMixStaff = revenue > 0 ? (staffRevenue / revenue) * 100 : 0;
        const revenueMixDayPass = revenue > 0 ? (dayPassRevenue / revenue) * 100 : 0;

        const profitTargetCoverage =
          profitVsBreakEven >= 0 && inputs.profitTarget > 0
            ? (profit / inputs.profitTarget) * 100
            : null;

        let breakEvenAttendancePercent: number | null = null;
        let breakEvenTotalAttendees: number | null = null;
        if (ticketPrice > 0) {
          const breakEvenPaidAttendees = (totalCosts - staffRevenue - dayPassRevenue) / ticketPrice;
          if (breakEvenPaidAttendees < 0) {
            breakEvenAttendancePercent = 0;
            breakEvenTotalAttendees = complimentaryTickets;
          } else {
            const total = breakEvenPaidAttendees + complimentaryTickets;
            breakEvenTotalAttendees = Math.ceil(total);
            breakEvenAttendancePercent = (total / maxOccupancy) * 100;
          }
        }

        const percentLabel = `${Math.round(mult * 100)}%`;
        const scenarioKey = `$${ticketPrice} / Staff $${staffPrice} / ${percentLabel}`;

        results.push({
          scenarioKey,
          ticketPrice,
          staffPrice,
          attendancePercent: mult * 100,
          attendees,
          revenue,
          totalCosts,
          totalCostsWithProfitTarget,
          profit,
          profitVsBreakEven,
          roi,
          costPerAttendee,
          profitMargin,
          profitPerAttendee,
          avgRevenuePerTicket,
          costCoverageRatio,
          revenueMixAttendee,
          revenueMixStaff,
          revenueMixDayPass,
          profitTargetCoverage,
          breakEvenAttendancePercent,
          breakEvenTotalAttendees,
        });
      }
    }
  }

  return results;
}
