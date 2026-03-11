import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditableNumberInput } from "@/components/inputs/EditableNumberInput";
import { useAppState } from "@/state/AppState";
import { useUpdateScenario } from "@/queries/hooks";
import { Check } from "lucide-react";
import type { Inputs } from "@satyrsmc/shared/client";

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

export function ScenarioInputsCard() {
  const updateScenarioMutation = useUpdateScenario();
  const { currentScenario, selectedScenarioId, refreshScenario } = useAppState();
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSaved = useCallback(() => {
    setSavedAt(Date.now());
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSavedAt(null);
      saveTimeoutRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    if (currentScenario?.inputs) {
      setInputs(currentScenario.inputs);
    } else if (!selectedScenarioId) {
      setInputs(DEFAULT_INPUTS);
    }
  }, [currentScenario?.inputs, selectedScenarioId]);

  if (!selectedScenarioId || !currentScenario) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Select a scenario above to view and edit its input variables.
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = (updates: Partial<Inputs>) => {
    setInputs((prev) => ({ ...prev, ...updates }));
  };

  const handleTicketPrices = (updates: Partial<Inputs["ticketPrices"]>) => {
    setInputs((prev) => ({
      ...prev,
      ticketPrices: { ...prev.ticketPrices, ...updates },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateScenarioMutation.mutateAsync({
        id: selectedScenarioId,
        body: { inputs },
      });
      await refreshScenario(selectedScenarioId);
      showSaved();
    } finally {
      setSaving(false);
    }
  };

  const tp = inputs.ticketPrices;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Scenario Inputs</CardTitle>
          <CardDescription>
            Edit variables for &quot;{currentScenario.name}&quot;. Click Save to persist changes.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {savedAt != null && (
            <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in duration-200">
              <Check className="size-3.5" />
              Saved
            </span>
          )}
          <Button onClick={handleSave} size="sm" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 border-t pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EditableNumberInput
            label="Max Occupancy"
            value={inputs.maxOccupancy}
            onChange={(v) => handleUpdate({ maxOccupancy: v })}
            min={1}
          />
          <EditableNumberInput
            label="Staff Count"
            value={inputs.staffCount}
            onChange={(v) => handleUpdate({ staffCount: v })}
            min={0}
          />
          <EditableNumberInput
            label="Complimentary Tickets"
            value={inputs.complimentaryTickets ?? 0}
            onChange={(v) => handleUpdate({ complimentaryTickets: v })}
            min={0}
          />
          <EditableNumberInput
            label="Profit Target ($)"
            value={inputs.profitTarget}
            onChange={(v) => handleUpdate({ profitTarget: v })}
            min={0}
          />
          <EditableNumberInput
            label="Day Pass Price ($)"
            value={inputs.dayPassPrice}
            onChange={(v) => handleUpdate({ dayPassPrice: v })}
            min={0}
          />
          <EditableNumberInput
            label="Estimated Day Passes Sold"
            value={inputs.dayPassesSold}
            onChange={(v) => handleUpdate({ dayPassesSold: v })}
            min={0}
          />
        </div>
        <div className="space-y-4">
          <h5 className="text-xs font-medium text-muted-foreground">Attendee ticket prices</h5>
          <div className="grid gap-4 sm:grid-cols-3">
            <EditableNumberInput
              label="Price 1 ($)"
              value={tp.proposedPrice1}
              onChange={(v) => handleTicketPrices({ proposedPrice1: v })}
              min={0}
            />
            <EditableNumberInput
              label="Price 2 ($)"
              value={tp.proposedPrice2}
              onChange={(v) => handleTicketPrices({ proposedPrice2: v })}
              min={0}
            />
            <EditableNumberInput
              label="Price 3 ($)"
              value={tp.proposedPrice3}
              onChange={(v) => handleTicketPrices({ proposedPrice3: v })}
              min={0}
            />
          </div>
        </div>
        <div className="space-y-4">
          <h5 className="text-xs font-medium text-muted-foreground">Staff ticket prices</h5>
          <div className="grid gap-4 sm:grid-cols-3">
            <EditableNumberInput
              label="Staff Price 1 ($)"
              value={tp.staffPrice1}
              onChange={(v) => handleTicketPrices({ staffPrice1: v })}
              min={0}
            />
            <EditableNumberInput
              label="Staff Price 2 ($)"
              value={tp.staffPrice2}
              onChange={(v) => handleTicketPrices({ staffPrice2: v })}
              min={0}
            />
            <EditableNumberInput
              label="Staff Price 3 ($)"
              value={tp.staffPrice3}
              onChange={(v) => handleTicketPrices({ staffPrice3: v })}
              min={0}
            />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Attendance: 25%, 50%, 75%, 100% of max occupancy.
        </p>
      </CardContent>
    </Card>
  );
}
