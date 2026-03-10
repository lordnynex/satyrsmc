import type { Inputs, LineItem } from "./budget-domain";

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
