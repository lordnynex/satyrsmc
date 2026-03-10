import type { Inputs } from "./budget-domain";

export type ScenarioKey = string;

export interface Scenario {
  id: string;
  name: string;
  description: string | null;
  inputs: Inputs;
  created_at?: string;
}

export interface ScenarioSummary {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

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
  /** Profit ÷ Revenue × 100 */
  profitMargin: number;
  /** Profit ÷ Attendees */
  profitPerAttendee: number;
  /** Revenue ÷ (Attendees + Staff) */
  avgRevenuePerTicket: number;
  /** Revenue ÷ Total costs */
  costCoverageRatio: number;
  /** Attendee revenue ÷ Total revenue × 100 */
  revenueMixAttendee: number;
  /** Staff revenue ÷ Total revenue × 100 */
  revenueMixStaff: number;
  /** Day pass revenue ÷ Total revenue × 100 */
  revenueMixDayPass: number;
  /** Profit ÷ Profit target × 100 (when meets target) */
  profitTargetCoverage: number | null;
  /** Attendance % needed to break even at this ticket/staff price */
  breakEvenAttendancePercent: number | null;
  /** Total attendees (paid + comp) needed to break even */
  breakEvenTotalAttendees: number | null;
}
