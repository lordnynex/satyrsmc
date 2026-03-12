import { createContext, useCallback, use, useReducer, type ReactNode } from "react";
import { trpc } from "@/trpc";
import {
  useUpdateScenario,
  useAddLineItem,
  useUpdateLineItem,
  useDeleteLineItem,
} from "@/queries/hooks";
import type { Budget, Inputs, LineItem, Scenario } from "@satyrsmc/shared/client";

const DEFAULT_CATEGORIES = [
  "Venue",
  "Food & Beverage",
  "Equipment",
  "Transport",
  "Admin",
  "Merchandise",
  "Miscellaneous",
];

const DEFAULT_INPUTS: Inputs = {
  profitTarget: 2500,
  staffCount: 14,
  maxOccupancy: 75,
  complimentaryTickets: 0,
  dayPassPrice: 50,
  dayPassesSold: 0,
  ticketPrices: {
    proposedPrice1: 200,
    proposedPrice2: 250,
    proposedPrice3: 300,
    staffPrice1: 150,
    staffPrice2: 125,
    staffPrice3: 100,
  },
};

interface AppState {
  budgets: Array<{ id: string; name: string; year: number; description: string | null }>;
  scenarios: Array<{ id: string; name: string; description: string | null }>;
  selectedBudgetId: string | null;
  selectedScenarioId: string | null;
  currentBudget: Budget | null;
  currentScenario: Scenario | null;
  categories: string[];
  loading: boolean;
  error: string | null;
}

type AppAction =
  | { type: "SET_BUDGETS"; payload: AppState["budgets"] }
  | { type: "SET_SCENARIOS"; payload: AppState["scenarios"] }
  | { type: "SET_SELECTED_BUDGET"; payload: string | null }
  | { type: "SET_SELECTED_SCENARIO"; payload: string | null }
  | { type: "SET_CURRENT_BUDGET"; payload: Budget | null }
  | { type: "SET_CURRENT_SCENARIO"; payload: Scenario | null }
  | { type: "UPDATE_SCENARIO_INPUTS_LOCAL"; payload: Partial<Inputs> }
  | { type: "ADD_LINE_ITEM_LOCAL"; payload: LineItem }
  | { type: "UPDATE_LINE_ITEM_LOCAL"; payload: { id: string; updates: Partial<LineItem> } }
  | { type: "DELETE_LINE_ITEM_LOCAL"; payload: string }
  | { type: "ADD_CATEGORY"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_BUDGETS":
      return { ...state, budgets: action.payload };
    case "SET_SCENARIOS":
      return { ...state, scenarios: action.payload };
    case "SET_SELECTED_BUDGET":
      return { ...state, selectedBudgetId: action.payload };
    case "SET_SELECTED_SCENARIO":
      return { ...state, selectedScenarioId: action.payload };
    case "SET_CURRENT_BUDGET": {
      const budget = action.payload;
      if (!budget?.lineItems?.length) return { ...state, currentBudget: budget };
      // Merge categories from line items so custom categories display correctly after reload
      const lineItemCategories = [
        ...new Set(budget.lineItems.map((li) => li.category).filter(Boolean)),
      ];
      const mergedCategories = [...DEFAULT_CATEGORIES];
      for (const cat of lineItemCategories) {
        if (!mergedCategories.includes(cat)) mergedCategories.push(cat);
      }
      return { ...state, currentBudget: budget, categories: mergedCategories };
    }
    case "SET_CURRENT_SCENARIO":
      return { ...state, currentScenario: action.payload };
    case "UPDATE_SCENARIO_INPUTS_LOCAL":
      return {
        ...state,
        currentScenario: state.currentScenario
          ? {
              ...state.currentScenario,
              inputs: { ...state.currentScenario.inputs, ...action.payload },
            }
          : null,
      };
    case "ADD_LINE_ITEM_LOCAL":
      return {
        ...state,
        currentBudget: state.currentBudget
          ? {
              ...state.currentBudget,
              lineItems: [...state.currentBudget.lineItems, action.payload],
            }
          : null,
      };
    case "UPDATE_LINE_ITEM_LOCAL": {
      const { id, updates } = action.payload;
      return {
        ...state,
        currentBudget: state.currentBudget
          ? {
              ...state.currentBudget,
              lineItems: state.currentBudget.lineItems.map((li) =>
                li.id === id ? { ...li, ...updates } : li,
              ),
            }
          : null,
      };
    }
    case "DELETE_LINE_ITEM_LOCAL":
      return {
        ...state,
        currentBudget: state.currentBudget
          ? {
              ...state.currentBudget,
              lineItems: state.currentBudget.lineItems.filter((li) => li.id !== action.payload),
            }
          : null,
      };
    case "ADD_CATEGORY": {
      const cat = action.payload.trim();
      if (!cat || state.categories.includes(cat)) return state;
      return { ...state, categories: [...state.categories, cat] };
    }
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface AppStateContextValue extends AppState {
  dispatch: React.Dispatch<AppAction>;
  selectBudget: (id: string | null) => void;
  selectScenario: (id: string | null) => void;
  refreshBudget: (id: string) => Promise<void>;
  refreshScenario: (id: string) => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshScenarios: () => Promise<void>;
  updateScenarioInputs: (scenarioId: string, inputs: Partial<Inputs>) => Promise<void>;
  addLineItem: (budgetId: string, item?: Partial<LineItem>) => Promise<void>;
  updateLineItem: (budgetId: string, id: string, updates: Partial<LineItem>) => Promise<void>;
  deleteLineItem: (budgetId: string, id: string) => Promise<void>;
  addCategory: (name: string) => void;
  getInputs: () => Inputs;
  getLineItems: () => LineItem[];
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    budgets: [],
    scenarios: [],
    selectedBudgetId: null,
    selectedScenarioId: null,
    currentBudget: null,
    currentScenario: null,
    categories: DEFAULT_CATEGORIES,
    loading: false,
    error: null,
  });

  // Selection only; actual budget/scenario data is loaded by BudgetScenarioLayout via TanStack Query.
  const selectBudget = useCallback((id: string | null) => {
    dispatch({ type: "SET_SELECTED_BUDGET", payload: id });
    dispatch({ type: "SET_CURRENT_BUDGET", payload: null });
  }, []);

  const selectScenario = useCallback((id: string | null) => {
    dispatch({ type: "SET_SELECTED_SCENARIO", payload: id });
    dispatch({ type: "SET_CURRENT_SCENARIO", payload: null });
  }, []);

  const utils = trpc.useUtils();
  const updateScenarioInputsMutation = useUpdateScenario();
  const addLineItemMutation = useAddLineItem();
  const updateLineItemMutation = useUpdateLineItem();
  const deleteLineItemMutation = useDeleteLineItem();

  const refreshBudget = useCallback(
    async (id: string) => {
      const budget = await utils.admin.budgets.get.fetch({ id });
      if (state.selectedBudgetId === id) {
        dispatch({ type: "SET_CURRENT_BUDGET", payload: budget as Budget });
      }
    },
    [state.selectedBudgetId, utils],
  );

  const refreshScenario = useCallback(
    async (id: string) => {
      const scenario = await utils.admin.scenarios.get.fetch({ id });
      if (state.selectedScenarioId === id) {
        dispatch({ type: "SET_CURRENT_SCENARIO", payload: scenario as Scenario });
      }
    },
    [state.selectedScenarioId, utils],
  );

  const refreshBudgets = useCallback(async () => {
    const list = await utils.admin.budgets.list.fetch();
    dispatch({
      type: "SET_BUDGETS",
      payload: list.map((b) => ({
        id: b.id,
        name: b.name,
        year: b.year,
        description: b.description ?? null,
      })),
    });
  }, [utils]);

  const refreshScenarios = useCallback(async () => {
    const list = await utils.admin.scenarios.list.fetch();
    dispatch({
      type: "SET_SCENARIOS",
      payload: list.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? null,
      })),
    });
  }, [utils]);

  const updateScenarioInputs = useCallback(
    async (scenarioId: string, inputs: Partial<Inputs>) => {
      const current = { ...DEFAULT_INPUTS, ...(state.currentScenario?.inputs ?? {}) };
      const merged = { ...current, ...inputs };
      await updateScenarioInputsMutation.mutateAsync({
        id: scenarioId,
        body: { inputs: merged },
      });
      dispatch({ type: "UPDATE_SCENARIO_INPUTS_LOCAL", payload: inputs });
    },
    [state.currentScenario, updateScenarioInputsMutation],
  );

  const addLineItem = useCallback(
    async (budgetId: string, item?: Partial<LineItem>) => {
      const budget = state.currentBudget;
      if (!budget || budget.id !== budgetId) return;
      const created = await addLineItemMutation.mutateAsync({
        budgetId,
        body: {
          name: item?.name ?? "New Item",
          category: item?.category ?? state.categories[0] ?? "Miscellaneous",
          comments: item?.comments,
          unitCost: item?.unitCost ?? 0,
          quantity: item?.quantity ?? 1,
          historicalCosts: item?.historicalCosts,
        },
      });
      dispatch({ type: "ADD_LINE_ITEM_LOCAL", payload: created as LineItem });
    },
    [state.currentBudget, state.categories, addLineItemMutation],
  );

  const updateLineItem = useCallback(
    async (budgetId: string, id: string, updates: Partial<LineItem>) => {
      await updateLineItemMutation.mutateAsync({ budgetId, itemId: id, body: updates });
      dispatch({ type: "UPDATE_LINE_ITEM_LOCAL", payload: { id, updates } });
    },
    [updateLineItemMutation],
  );

  const deleteLineItem = useCallback(
    async (budgetId: string, id: string) => {
      await deleteLineItemMutation.mutateAsync({ budgetId, itemId: id });
      dispatch({ type: "DELETE_LINE_ITEM_LOCAL", payload: id });
    },
    [deleteLineItemMutation],
  );

  const addCategory = useCallback((name: string) => {
    dispatch({ type: "ADD_CATEGORY", payload: name });
  }, []);

  const getInputs = useCallback((): Inputs => {
    const base = state.currentScenario?.inputs ?? {};
    return { ...DEFAULT_INPUTS, ...base };
  }, [state.currentScenario]);

  const getLineItems = useCallback((): LineItem[] => {
    return state.currentBudget?.lineItems ?? [];
  }, [state.currentBudget]);

  const value: AppStateContextValue = {
    ...state,
    dispatch,
    selectBudget,
    selectScenario,
    refreshBudget,
    refreshScenario,
    refreshBudgets,
    refreshScenarios,
    updateScenarioInputs,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    addCategory,
    getInputs,
    getLineItems,
  };

  return <AppStateContext value={value}>{children}</AppStateContext>;
}

export function useAppState(): AppStateContextValue {
  const ctx = use(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
}
