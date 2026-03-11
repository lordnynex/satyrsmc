import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";
import type { Budget, BudgetSummary, Scenario, ScenarioSummary } from "@satyrsmc/shared/client";

/** Data: BudgetSummary[] */
export function useBudgetsSuspense() {
  return trpc.admin.budgets.list.useSuspenseQuery();
}

/** Data: ScenarioSummary[] */
export function useScenariosSuspense() {
  return trpc.admin.scenarios.list.useSuspenseQuery();
}

/** Data: BudgetSummary[] */
export function useBudgetsOptional() {
  return trpc.admin.budgets.list.useQuery();
}

/** Data: ScenarioSummary[] */
export function useScenariosOptional() {
  return trpc.admin.scenarios.list.useQuery();
}

/** Data: Budget */
export function useBudgetSuspense(id: string) {
  return trpc.admin.budgets.get.useSuspenseQuery({ id });
}

/** Data: Budget */
export function useBudgetOptional(id: string, options?: { enabled?: boolean }) {
  return trpc.admin.budgets.get.useQuery(
    { id },
    { enabled: options?.enabled !== false && !!id, ...options }
  );
}

/** Data: Scenario */
export function useScenarioSuspense(id: string) {
  return trpc.admin.scenarios.get.useSuspenseQuery({ id });
}

// Mutations
export function useCreateScenario() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; inputs?: Record<string, unknown> }) =>
      api.scenarios.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scenarios }),
  });
}

export function useUpdateScenario() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; description?: string; inputs?: Record<string, unknown> };
    }) => api.scenarios.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.scenarios });
      qc.invalidateQueries({ queryKey: queryKeys.scenario(id) });
    },
  });
}

export function useDeleteScenario() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.scenarios.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scenarios }),
  });
}

export function useCreateBudget() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; year: number; description?: string }) =>
      api.budgets.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budgets }),
  });
}

export function useUpdateBudget() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; year?: number; description?: string };
    }) => api.budgets.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets });
      qc.invalidateQueries({ queryKey: queryKeys.budget(id) });
    },
  });
}

export function useDeleteBudget() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.budgets.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budgets }),
  });
}

export function useAddLineItem() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, body }: { budgetId: string; body: Record<string, unknown> }) =>
      api.budgets.addLineItem(budgetId, body),
    onSuccess: (_, { budgetId }) => qc.invalidateQueries({ queryKey: queryKeys.budget(budgetId) }),
  });
}

export function useUpdateLineItem() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetId,
      itemId,
      body,
    }: {
      budgetId: string;
      itemId: string;
      body: Record<string, unknown>;
    }) => api.budgets.updateLineItem(budgetId, itemId, body),
    onSuccess: (_, { budgetId }) => qc.invalidateQueries({ queryKey: queryKeys.budget(budgetId) }),
  });
}

export function useDeleteLineItem() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, itemId }: { budgetId: string; itemId: string }) =>
      api.budgets.deleteLineItem(budgetId, itemId),
    onSuccess: (_, { budgetId }) => qc.invalidateQueries({ queryKey: queryKeys.budget(budgetId) }),
  });
}
