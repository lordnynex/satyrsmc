/**
 * Client-only state types for budget/scenario UI (e.g. AppState, scenario metrics).
 * Not part of DTO layer; shapes match current usage and align with DTO LineItem/Budget where applicable.
 */

export interface Inputs {
  profitTarget: number;
  staffCount: number;
  maxOccupancy: number;
  complimentaryTickets: number;
  dayPassPrice: number;
  dayPassesSold: number;
  ticketPrices: {
    proposedPrice1: number;
    proposedPrice2: number;
    proposedPrice3: number;
    staffPrice1: number;
    staffPrice2: number;
    staffPrice3: number;
  };
}

export interface LineItem {
  id: string;
  name: string;
  category: string;
  comments?: string | null;
  unitCost: number;
  quantity: number;
  historicalCosts?: Record<string, number> | null;
}

export interface AttendanceScenarios {
  ticketPrices: number[];
  attendanceLevels: Record<string, number[]>;
}

export interface BadgerBudgetState {
  version: 1;
  inputs: Inputs;
  lineItems: LineItem[];
  attendanceScenarios: AttendanceScenarios;
  categories: string[];
}

/** Client-computed scenario metrics (e.g. from useScenarioMetrics). */
export type ScenarioKey = string;

export interface ScenarioMetrics {
  scenarioKey: ScenarioKey;
  ticketPrice: number;
  staffPrice: number;
  attendancePercent: number;
  attendees: number;
  revenue: number;
  totalCosts: number;
  totalCostsWithProfitTarget: number;
  profit: number;
  profitVsBreakEven: number;
  roi: number;
  costPerAttendee: number;
  profitMargin: number;
  profitPerAttendee: number;
  avgRevenuePerTicket: number;
  costCoverageRatio: number;
  revenueMixAttendee: number;
  revenueMixStaff: number;
  revenueMixDayPass: number;
  profitTargetCoverage: number | null;
  breakEvenAttendancePercent: number | null;
  breakEvenTotalAttendees: number | null;
}
