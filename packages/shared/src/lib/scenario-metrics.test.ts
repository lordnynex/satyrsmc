import { describe, it, expect } from "vitest";
import { computeScenarioMetrics } from "./scenario-metrics";
import type { Inputs, LineItem } from "../client/budget-state";

function makeInputs(overrides: Partial<Inputs> = {}): Inputs {
  return {
    maxOccupancy: 100,
    staffCount: 10,
    profitTarget: 500,
    complimentaryTickets: 5,
    dayPassPrice: 10,
    dayPassesSold: 20,
    ticketPrices: {
      proposedPrice1: 50,
      proposedPrice2: 75,
      proposedPrice3: 100,
      staffPrice1: 25,
      staffPrice2: 30,
      staffPrice3: 35,
    },
    ...overrides,
  };
}

const sampleLineItems: LineItem[] = [
  { id: "1", name: "Venue", category: "Facility", unitCost: 500, quantity: 1 },
  { id: "2", name: "Food", category: "Catering", unitCost: 10, quantity: 50 },
];

describe("computeScenarioMetrics", () => {
  it("returns results for all attendance levels", () => {
    const results = computeScenarioMetrics(makeInputs(), sampleLineItems);

    // 10 attendance multipliers × valid price combos where staffPrice <= ticketPrice
    // proposedPrice1=50: staffPrice1=25, staffPrice2=30, staffPrice3=35 → 3
    // proposedPrice2=75: staffPrice1=25, staffPrice2=30, staffPrice3=35 → 3
    // proposedPrice3=100: staffPrice1=25, staffPrice2=30, staffPrice3=35 → 3
    // Total combos per attendance level = 9, × 10 levels = 90
    expect(results.length).toBe(90);
  });

  it("calculates revenue correctly", () => {
    const results = computeScenarioMetrics(makeInputs(), sampleLineItems);
    const result = results[0];
    if (!result) throw new Error("Expected at least one result");

    expect(result.revenue).toBe(
      result.attendees * result.ticketPrice -
        makeInputs().complimentaryTickets * result.ticketPrice +
        makeInputs().staffCount * result.staffPrice +
        makeInputs().dayPassPrice * makeInputs().dayPassesSold,
    );
  });

  it("calculates profit correctly", () => {
    const results = computeScenarioMetrics(makeInputs(), sampleLineItems);

    for (const result of results) {
      expect(result.profit).toBe(result.revenue - result.totalCosts);
    }
  });

  it("handles zero line items", () => {
    const results = computeScenarioMetrics(makeInputs(), []);

    for (const result of results) {
      expect(result.totalCosts).toBe(0);
      expect(result.profit).toBe(result.revenue);
    }
  });

  it("handles zero ticket price", () => {
    const inputs = makeInputs({
      ticketPrices: {
        proposedPrice1: 0,
        proposedPrice2: 0,
        proposedPrice3: 0,
        staffPrice1: 0,
        staffPrice2: 0,
        staffPrice3: 0,
      },
    });
    const results = computeScenarioMetrics(inputs, sampleLineItems);

    for (const result of results) {
      expect(result.breakEvenAttendancePercent).toBeNull();
    }
  });

  it("scenarioKey matches expected format", () => {
    const results = computeScenarioMetrics(makeInputs(), sampleLineItems);
    const pattern = /^\$\d+ \/ Staff \$\d+ \/ \d+%$/;

    for (const result of results) {
      expect(result.scenarioKey).toMatch(pattern);
    }
  });

  it("complimentary tickets reduce paid attendees", () => {
    const inputs = makeInputs({ complimentaryTickets: 5 });
    const results = computeScenarioMetrics(inputs, sampleLineItems);

    // At 10% attendance (mult=0.1), attendees = round(100 * 0.1) = 10
    // paidAttendees = max(0, 10 - 5) = 5
    // attendeeRevenue = 5 * ticketPrice
    const first = results[0];
    if (!first) throw new Error("Expected at least one result");

    expect(first.attendees).toBe(10);
    const expectedAttendeeRevenue =
      Math.max(0, first.attendees - inputs.complimentaryTickets) * first.ticketPrice;
    const expectedStaffRevenue = inputs.staffCount * first.staffPrice;
    const expectedDayPassRevenue = inputs.dayPassPrice * inputs.dayPassesSold;
    expect(first.revenue).toBe(
      expectedAttendeeRevenue + expectedStaffRevenue + expectedDayPassRevenue,
    );
  });

  it("skips scenarios where staffPrice > ticketPrice", () => {
    const inputs = makeInputs({
      ticketPrices: {
        proposedPrice1: 10,
        proposedPrice2: 20,
        proposedPrice3: 30,
        staffPrice1: 15,
        staffPrice2: 25,
        staffPrice3: 35,
      },
    });
    const results = computeScenarioMetrics(inputs, sampleLineItems);

    for (const result of results) {
      expect(result.staffPrice).toBeLessThanOrEqual(result.ticketPrice);
    }
  });
});
