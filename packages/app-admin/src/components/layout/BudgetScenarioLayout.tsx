import { Suspense, useEffect, type ReactNode } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAppState } from "@/state/AppState";
import {
  useBudgetsSuspense,
  useScenariosSuspense,
  useBudgetSuspense,
  useScenarioSuspense,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { PageLoading } from "./PageLoading";

/**
 * Loads budgets and scenarios lists (suspends), syncs to AppState, sets default
 * selection, then loads selected budget and scenario (suspends again) and syncs.
 * Use only on /budgeting/projections, /budgeting/budget, /budgeting/scenarios routes.
 */
const PROJECTIONS_PATH = "/budgeting/projections";

function BudgetScenarioListsSync({ children }: { children: ReactNode }) {
  const budgets = unwrapSuspenseData(useBudgetsSuspense()) ?? [];
  const scenarios = unwrapSuspenseData(useScenariosSuspense()) ?? [];
  const { dispatch, selectedBudgetId, selectedScenarioId } = useAppState();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isProjections = location.pathname === PROJECTIONS_PATH;

  useEffect(() => {
    dispatch({ type: "SET_BUDGETS", payload: budgets });
    dispatch({ type: "SET_SCENARIOS", payload: scenarios });
  }, [budgets, scenarios, dispatch]);

  // Sync URL params to selection when on budget/:id or scenarios/:id
  const urlBudgetId = location.pathname.match(/^\/budgeting\/budget\/([^/]+)$/)?.[1];
  const urlScenarioId = location.pathname.match(/^\/budgeting\/scenarios\/([^/]+)$/)?.[1];

  // On projections, also read from search params for hot linking (validate IDs exist)
  const rawParamBudgetId = isProjections ? searchParams.get("budgetId") : null;
  const rawParamScenarioId = isProjections ? searchParams.get("scenarioId") : null;
  const paramBudgetId = rawParamBudgetId && budgets.some((b) => b.id === rawParamBudgetId) ? rawParamBudgetId : null;
  const paramScenarioId = rawParamScenarioId && scenarios.some((s) => s.id === rawParamScenarioId) ? rawParamScenarioId : null;

  useEffect(() => {
    if (urlBudgetId && budgets.some((b) => b.id === urlBudgetId)) {
      dispatch({ type: "SET_SELECTED_BUDGET", payload: urlBudgetId });
    } else if (paramBudgetId && budgets.some((b) => b.id === paramBudgetId) && selectedBudgetId == null) {
      dispatch({ type: "SET_SELECTED_BUDGET", payload: paramBudgetId });
    } else if (budgets.length && selectedBudgetId == null) {
      const first = budgets[0];
      if (first) dispatch({ type: "SET_SELECTED_BUDGET", payload: first.id });
    }
  }, [budgets, selectedBudgetId, urlBudgetId, paramBudgetId, dispatch]);

  useEffect(() => {
    if (urlScenarioId && scenarios.some((s) => s.id === urlScenarioId)) {
      dispatch({ type: "SET_SELECTED_SCENARIO", payload: urlScenarioId });
    } else if (paramScenarioId && scenarios.some((s) => s.id === paramScenarioId) && selectedScenarioId == null) {
      dispatch({ type: "SET_SELECTED_SCENARIO", payload: paramScenarioId });
    } else if (scenarios.length && selectedScenarioId == null) {
      const first = scenarios[0];
      if (first) dispatch({ type: "SET_SELECTED_SCENARIO", payload: first.id });
    }
  }, [scenarios, selectedScenarioId, urlScenarioId, paramScenarioId, dispatch]);

  // Sync selection back to URL on projections for shareable links
  useEffect(() => {
    if (!isProjections || !selectedBudgetId || !selectedScenarioId) return;
    setSearchParams((prev) => {
      const current = prev.get("budgetId");
      const currentScenario = prev.get("scenarioId");
      if (current === selectedBudgetId && currentScenario === selectedScenarioId) return prev;
      const next = new URLSearchParams(prev);
      next.set("budgetId", selectedBudgetId);
      next.set("scenarioId", selectedScenarioId);
      return next;
    }, { replace: true });
  }, [isProjections, selectedBudgetId, selectedScenarioId, setSearchParams]);

  // Prefer selectedBudgetId/selectedScenarioId over URL params so dropdown changes update immediately.
  // URL params are for initial load (shared links); AppState selection reflects user interaction.
  const budgetId = urlBudgetId ?? selectedBudgetId ?? paramBudgetId ?? budgets[0]?.id ?? null;
  const scenarioId = urlScenarioId ?? selectedScenarioId ?? paramScenarioId ?? scenarios[0]?.id ?? null;

  // On list-only or standalone pages, render children without full data sync
  const isBudgetList = location.pathname === "/budgeting/budget";
  const isScenarioList = location.pathname === "/budgeting/scenarios";
  const isStandalone = location.pathname === "/budgeting/actual-spend";
  if (isBudgetList || isScenarioList || isStandalone) {
    return <>{children}</>;
  }

  if (!budgetId || !scenarioId) {
    return (
      <div className="flex min-h-[280px] items-center justify-center p-6">
        <p className="text-muted-foreground">
          {budgets.length === 0 && scenarios.length === 0
            ? "Create a budget and a scenario to get started."
            : "Select a budget and scenario."}
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoading />} key={`${budgetId}-${scenarioId}`}>
      <BudgetScenarioDataSync budgetId={budgetId} scenarioId={scenarioId}>
        {children}
      </BudgetScenarioDataSync>
    </Suspense>
  );
}

function BudgetScenarioDataSync({
  budgetId,
  scenarioId,
  children,
}: {
  budgetId: string;
  scenarioId: string;
  children: ReactNode;
}) {
  const budget = unwrapSuspenseData(useBudgetSuspense(budgetId))!;
  const scenario = unwrapSuspenseData(useScenarioSuspense(scenarioId))!;
  const { dispatch } = useAppState();

  useEffect(() => {
    dispatch({ type: "SET_CURRENT_BUDGET", payload: budget });
    dispatch({ type: "SET_CURRENT_SCENARIO", payload: scenario });
  }, [budget, scenario, dispatch]);

  return <>{children}</>;
}

export function BudgetScenarioLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <BudgetScenarioListsSync>{children}</BudgetScenarioListsSync>
    </Suspense>
  );
}