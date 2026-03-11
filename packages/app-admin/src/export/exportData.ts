import type { Inputs, LineItem, ScenarioMetrics } from "@satyrsmc/shared/client";
import { isFoodCategory, EVENT_DAYS } from "@/lib/event-constants";

export interface ExportSummary {
  totalCosts: number;
  totalWithProfitTarget: number;
  attendanceBreakdown: { percent: number; tickets: number }[];
  staffCount: number;
  lowestBreakEven: number | null;
  lowestMeetingTarget: number | null;
  minStaffPrice: number;
  dayPassRevenue: number;
  dayPassesSold: number;
  dayPassPrice: number;
  complimentaryTickets: number;
  revenueLostToComps: number;
  compTicketPriceRef: number;
  breakEvenTickets: number | null;
  breakEvenTicketsRange: { min: number; max: number } | null;
  breakEvenPercent: number | null;
  breakEvenTicketContext: string | null;
  mostAccessible: {
    ticketPrice: number;
    staffPrice: number;
    attendancePercent: number;
    profit: number;
  } | null;
  bestScenario: {
    profit: number;
    ticketPrice: number;
    staffPrice: number;
    attendancePercent: number;
  } | null;
  worstProfitable: { profit: number } | null;
  revenueMix: { attendee: number; staff: number; dayPass: number } | null;
  gaTicketsAvailable: number;
  maxOccupancy: number;
  profitableCount: number;
  meetingTargetCount: number;
}

export interface ExportFoodCost {
  totalFoodCost: number;
  costPerMeal: number;
  foodCostPerAttendee: number;
  foodCostPerDayPass: number;
  foodCostPerDay: number;
  foodCostPerStaff: number;
  totalMeals: number;
}

export interface ExportScenarioMatrix {
  byAttendance: Record<number, ScenarioMetrics[]>;
  attendanceLevels: number[];
}

export function computeExportSummary(
  inputs: Inputs,
  lineItems: LineItem[],
  metrics: ScenarioMetrics[],
): ExportSummary {
  const totalCosts = lineItems.reduce((sum, li) => sum + li.unitCost * li.quantity, 0);
  const totalWithProfitTarget = totalCosts + inputs.profitTarget;
  const maxOccupancy = inputs.maxOccupancy;
  const staffCount = inputs.staffCount;
  const gaTicketsAvailable = Math.max(0, maxOccupancy - staffCount);
  const attendanceBreakdown = [25, 50, 75, 100].map((percent) => ({
    percent,
    tickets: Math.round(maxOccupancy * (percent / 100)),
  }));

  const profitableScenarios = metrics.filter((m) => m.profit >= 0);
  const meetingTargetScenarios = metrics.filter((m) => m.profitVsBreakEven >= 0);
  const minStaffPrice = metrics.length > 0 ? Math.min(...metrics.map((m) => m.staffPrice)) : 0;
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

  const dayPassPrice = inputs.dayPassPrice ?? 0;
  const dayPassesSold = inputs.dayPassesSold ?? 0;
  const dayPassRevenue = dayPassPrice * dayPassesSold;

  const complimentaryTickets = inputs.complimentaryTickets ?? 0;
  const mostAccessible =
    profitableScenarios.length > 0
      ? [...profitableScenarios].sort((a, b) => {
          if (a.ticketPrice !== b.ticketPrice) return a.ticketPrice - b.ticketPrice;
          return a.staffPrice - b.staffPrice;
        })[0]
      : null;
  const revenueLostToComps = mostAccessible
    ? complimentaryTickets * mostAccessible.ticketPrice
    : complimentaryTickets * (inputs.ticketPrices.proposedPrice1 || 0);
  const compTicketPriceRef = mostAccessible
    ? mostAccessible.ticketPrice
    : inputs.ticketPrices.proposedPrice1 || 0;

  const breakEvenAtMostAccessible = mostAccessible?.breakEvenAttendancePercent;
  const breakEvenTicketsAtMostAccessible = mostAccessible?.breakEvenTotalAttendees;
  const breakEvenFiltered = metrics.filter(
    (m) =>
      m.breakEvenTotalAttendees != null &&
      m.breakEvenAttendancePercent != null &&
      m.breakEvenAttendancePercent >= 0 &&
      m.breakEvenAttendancePercent <= 100,
  );
  const breakEvenTicketCounts = breakEvenFiltered.map((m) => m.breakEvenTotalAttendees!);
  const breakEvenTicketsMin =
    breakEvenTicketCounts.length > 0 ? Math.min(...breakEvenTicketCounts) : null;
  const breakEvenTicketsMax =
    breakEvenTicketCounts.length > 0 ? Math.max(...breakEvenTicketCounts) : null;

  let breakEvenTickets: number | null = null;
  let breakEvenTicketsRange: { min: number; max: number } | null = null;
  let breakEvenPercent: number | null = null;
  let breakEvenTicketContext: string | null = null;

  if (
    mostAccessible &&
    breakEvenTicketsAtMostAccessible != null &&
    breakEvenAtMostAccessible != null &&
    breakEvenAtMostAccessible <= 100
  ) {
    breakEvenTickets = breakEvenTicketsAtMostAccessible;
    breakEvenPercent = breakEvenAtMostAccessible;
    breakEvenTicketContext = `At $${mostAccessible.ticketPrice} ticket / $${mostAccessible.staffPrice} staff`;
  } else if (breakEvenTicketsMin != null && breakEvenTicketsMax != null) {
    breakEvenTicketsRange = { min: breakEvenTicketsMin, max: breakEvenTicketsMax };
    breakEvenTicketContext = "Total attendees (paid + comp) needed to break even";
  }

  const bestScenario =
    metrics.length > 0 ? metrics.reduce((a, b) => (b.profit > a.profit ? b : a)) : null;
  const worstProfitable =
    profitableScenarios.length > 0
      ? profitableScenarios.reduce((a, b) => (b.profit < a.profit ? b : a))
      : null;

  const revenueMixScenario =
    mostAccessible ?? bestScenario ?? metrics.find((m) => m.attendancePercent === 100);
  const revenueMix = revenueMixScenario
    ? {
        attendee: revenueMixScenario.revenueMixAttendee,
        staff: revenueMixScenario.revenueMixStaff,
        dayPass: revenueMixScenario.revenueMixDayPass,
      }
    : null;

  return {
    totalCosts,
    totalWithProfitTarget,
    attendanceBreakdown,
    staffCount,
    lowestBreakEven,
    lowestMeetingTarget,
    minStaffPrice,
    dayPassRevenue,
    dayPassesSold,
    dayPassPrice,
    complimentaryTickets,
    revenueLostToComps,
    compTicketPriceRef: compTicketPriceRef,
    breakEvenTickets,
    breakEvenTicketsRange,
    breakEvenPercent,
    breakEvenTicketContext,
    mostAccessible: mostAccessible
      ? {
          ticketPrice: mostAccessible.ticketPrice,
          staffPrice: mostAccessible.staffPrice,
          attendancePercent: mostAccessible.attendancePercent,
          profit: mostAccessible.profit,
        }
      : null,
    bestScenario: bestScenario
      ? {
          profit: bestScenario.profit,
          ticketPrice: bestScenario.ticketPrice,
          staffPrice: bestScenario.staffPrice,
          attendancePercent: bestScenario.attendancePercent,
        }
      : null,
    worstProfitable: worstProfitable ? { profit: worstProfitable.profit } : null,
    revenueMix,
    gaTicketsAvailable,
    maxOccupancy,
    profitableCount: profitableScenarios.length,
    meetingTargetCount: meetingTargetScenarios.length,
  };
}

export function computeExportFoodCost(
  inputs: Inputs,
  lineItems: LineItem[],
): ExportFoodCost | null {
  const totalFoodCost = lineItems
    .filter((li) => isFoodCategory(li.category))
    .reduce((sum, li) => sum + li.unitCost * li.quantity, 0);

  if (totalFoodCost === 0) return null;

  const maxOccupancy = inputs.maxOccupancy;
  const staffCount = inputs.staffCount;
  const dayPassesSold = inputs.dayPassesSold ?? 0;
  const attendeeMeals = maxOccupancy * EVENT_DAYS;
  const staffMeals = staffCount * EVENT_DAYS;
  const dayPassMeals = dayPassesSold * 1;
  const totalMeals = attendeeMeals + staffMeals + dayPassMeals;
  const costPerMeal = totalMeals > 0 ? totalFoodCost / totalMeals : 0;

  return {
    totalFoodCost,
    costPerMeal,
    foodCostPerAttendee: costPerMeal * EVENT_DAYS,
    foodCostPerDayPass: costPerMeal,
    foodCostPerDay: totalFoodCost / EVENT_DAYS,
    foodCostPerStaff: costPerMeal * EVENT_DAYS,
    totalMeals,
  };
}

export function computeExportScenarioMatrix(metrics: ScenarioMetrics[]): ExportScenarioMatrix {
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
    .sort((a, b) => a - b);
  return { byAttendance, attendanceLevels };
}

export function getCategoryTotals(lineItems: LineItem[]): Record<string, number> {
  return lineItems.reduce(
    (acc, li) => {
      const total = li.unitCost * li.quantity;
      acc[li.category] = (acc[li.category] ?? 0) + total;
      return acc;
    },
    {} as Record<string, number>,
  );
}
