import { useNavigate } from "react-router-dom";
import { InputsPanel } from "@/components/inputs/InputsPanel";
import { BudgetsPanel } from "@/components/budget/BudgetsPanel";
import { ScenariosPanel } from "@/components/scenarios/ScenariosPanel";
import { EventsPanel } from "@/components/events/EventsPanel";
import { CostPerCategoryChart } from "@/components/charts/CostPerCategoryChart";
import { CostPerCategoryBarChart } from "@/components/charts/CostPerCategoryBarChart";
import { useAppState } from "@/state/AppState";
import { useScenarioMetrics } from "@/hooks/useScenarioMetrics";
import { SummarySection } from "@/components/dashboard/SummarySection";
import { FoodCostBreakdown } from "@/components/dashboard/FoodCostBreakdown";
import { ScenarioMatrixTable } from "@/components/dashboard/ScenarioMatrixTable";
import { ScenarioProfitHeatmap } from "@/components/scenarios/ScenarioProfitHeatmap";

interface MainProps {
  activeTab: string;
  onPrint?: () => void;
  onEmail?: () => void;
}

export function Main({ activeTab, onPrint: _onPrint, onEmail: _onEmail }: MainProps) {
  const navigate = useNavigate();
  const { getInputs, getLineItems, selectedScenarioId } = useAppState();
  const metrics = useScenarioMetrics(getInputs(), getLineItems());

  return (
    <main className="space-y-6 p-4 md:p-6">
      {activeTab === "events" && <EventsPanel />}
      {activeTab === "projections" && (
        <>
          <InputsPanel
            readOnly
            onEditScenario={() =>
              navigate(
                selectedScenarioId
                  ? `/budgeting/scenarios/${selectedScenarioId}`
                  : "/budgeting/scenarios",
              )
            }
          />
          <section id="summary" className="scroll-mt-28">
            <SummarySection metrics={metrics} filteredMetrics={metrics} />
          </section>
          <section id="food-cost" className="scroll-mt-28">
            <FoodCostBreakdown lineItems={getLineItems()} inputs={getInputs()} />
          </section>
          <section id="cost-analysis" className="scroll-mt-28 grid gap-6 md:grid-cols-2">
            <CostPerCategoryChart lineItems={getLineItems()} />
            <CostPerCategoryBarChart lineItems={getLineItems()} />
          </section>
          <section id="scenario-matrix" className="scroll-mt-28 space-y-6">
            <ScenarioProfitHeatmap metrics={metrics} profitTarget={getInputs().profitTarget} />
            <ScenarioMatrixTable metrics={metrics} profitTarget={getInputs().profitTarget} />
          </section>
        </>
      )}
      {activeTab === "budget" && <BudgetsPanel />}
      {activeTab === "scenarios" && <ScenariosPanel />}
    </main>
  );
}
