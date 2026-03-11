import { useMemo } from "react";
import type { Inputs, LineItem, ScenarioMetrics } from "@satyrsmc/shared/client";
import { computeScenarioMetrics } from "@satyrsmc/shared/lib/scenario-metrics";

export function useScenarioMetrics(inputs: Inputs, lineItems: LineItem[]): ScenarioMetrics[] {
  return useMemo(() => computeScenarioMetrics(inputs, lineItems), [inputs, lineItems]);
}
