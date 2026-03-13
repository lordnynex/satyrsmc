import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronUp } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppState } from "@/state/AppState";
import { ExportDropdown } from "./ExportDropdown";

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "food-cost", label: "Food Cost" },
  { id: "cost-analysis", label: "Cost Analysis" },
  { id: "scenario-matrix", label: "Scenario Matrix" },
] as const;

interface ProjectionsSubNavProps {
  className?: string;
  onPrint?: () => void;
  onEmail?: () => void;
}

export function ProjectionsSubNav({ className, onPrint, onEmail }: ProjectionsSubNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { budgets, scenarios, selectedBudgetId, selectedScenarioId, selectBudget, selectScenario } =
    useAppState();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (location.hash) {
      navigate(location.pathname + location.search, { replace: true });
    }
  };

  return (
    <div
      className={cn(
        "sticky top-14 z-30 flex flex-wrap items-center justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-4 sm:gap-6 min-w-0">
          <div className="space-y-2 min-w-0 flex-1 sm:flex-initial">
            <Label className="text-xs text-muted-foreground">Budget</Label>
            <Select value={selectedBudgetId ?? ""} onValueChange={(v) => selectBudget(v || null)}>
              <SelectTrigger className="h-8 w-full min-w-0 sm:w-[180px]">
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
          <div className="space-y-2 min-w-0 flex-1 sm:flex-initial">
            <Label className="text-xs text-muted-foreground">Scenario</Label>
            <Select
              value={selectedScenarioId ?? ""}
              onValueChange={(v) => selectScenario(v || null)}
            >
              <SelectTrigger className="h-8 w-full min-w-0 sm:w-[180px]">
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
        <nav
          className="flex items-center gap-1 overflow-x-auto sm:overflow-visible sm:border-l sm:pl-6 shrink-0 min-w-0"
          aria-label="Projections page sections"
        >
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap shrink-0"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ChevronUp className="size-4" />
        </Button>
        {onPrint && onEmail && <ExportDropdown onPrint={onPrint} onEmail={onEmail} />}
      </div>
    </div>
  );
}
