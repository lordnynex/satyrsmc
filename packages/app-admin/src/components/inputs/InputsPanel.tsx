import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/state/AppState";
import { EditableNumberInput } from "./EditableNumberInput";
import { TicketPriceInputs } from "./TicketPriceInputs";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";

interface InputsPanelProps {
  readOnly?: boolean;
  onEditScenario?: () => void;
}

export function InputsPanel({ readOnly, onEditScenario }: InputsPanelProps) {
  const { getInputs, updateScenarioInputs, selectedScenarioId } = useAppState();
  const inputs = getInputs();
  const [open, setOpen] = useState(false);

  const handleUpdate = (updates: Partial<typeof inputs>) => {
    if (selectedScenarioId) {
      updateScenarioInputs(selectedScenarioId, updates);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Scenario Inputs</CardTitle>
        <div className="flex items-center gap-2">
          {readOnly && onEditScenario && (
            <Button variant="link" size="sm" className="text-primary" onClick={onEditScenario}>
              <ExternalLink className="size-4" />
              Edit on Scenarios page
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
            {open ? (
              <>
                <ChevronUp className="size-4" />
                Hide variables
              </>
            ) : (
              <>
                <ChevronDown className="size-4" />
                Show variables
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-6 border-t pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EditableNumberInput
              label="Max Occupancy"
              value={inputs.maxOccupancy}
              onChange={(v) => handleUpdate({ maxOccupancy: v })}
              min={1}
              readOnly={readOnly}
            />
            <EditableNumberInput
              label="Staff Count"
              value={inputs.staffCount}
              onChange={(v) => handleUpdate({ staffCount: v })}
              min={0}
              readOnly={readOnly}
            />
            <EditableNumberInput
              label="Complimentary Tickets"
              value={inputs.complimentaryTickets ?? 0}
              onChange={(v) => handleUpdate({ complimentaryTickets: v })}
              min={0}
              readOnly={readOnly}
            />
            <EditableNumberInput
              label="Profit Target ($)"
              value={inputs.profitTarget}
              onChange={(v) => handleUpdate({ profitTarget: v })}
              min={0}
              readOnly={readOnly}
            />
            <EditableNumberInput
              label="Day Pass Price ($)"
              value={inputs.dayPassPrice}
              onChange={(v) => handleUpdate({ dayPassPrice: v })}
              min={0}
              readOnly={readOnly}
            />
            <EditableNumberInput
              label="Estimated Day Passes Sold"
              value={inputs.dayPassesSold}
              onChange={(v) => handleUpdate({ dayPassesSold: v })}
              min={0}
              readOnly={readOnly}
            />
          </div>
          <TicketPriceInputs readOnly={readOnly} />
          <p className="text-muted-foreground text-sm">
            Attendance: 25%, 50%, 75%, 100% of max occupancy.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
