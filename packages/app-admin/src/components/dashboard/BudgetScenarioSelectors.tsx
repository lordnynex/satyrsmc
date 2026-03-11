import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAppState } from "@/state/AppState";

export function BudgetScenarioSelectors() {
  const { budgets, scenarios, selectedBudgetId, selectedScenarioId, selectBudget, selectScenario } =
    useAppState();

  return (
    <div className="flex flex-wrap items-end gap-6">
      <div className="space-y-2">
        <Label>Budget</Label>
        <Select value={selectedBudgetId ?? ""} onValueChange={(v) => selectBudget(v || null)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select budget" />
          </SelectTrigger>
          <SelectContent>
            {budgets.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name} ({b.year})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Scenario</Label>
        <Select value={selectedScenarioId ?? ""} onValueChange={(v) => selectScenario(v || null)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select scenario" />
          </SelectTrigger>
          <SelectContent>
            {scenarios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
