import { useAppState } from "@/state/AppState";
import { EditableNumberInput } from "./EditableNumberInput";

interface TicketPriceInputsProps {
  readOnly?: boolean;
}

export function TicketPriceInputs({ readOnly }: TicketPriceInputsProps) {
  const { getInputs, updateScenarioInputs, selectedScenarioId } = useAppState();
  const tp = getInputs().ticketPrices;

  const handleUpdate = (updates: Partial<typeof tp>) => {
    if (selectedScenarioId) {
      updateScenarioInputs(selectedScenarioId, { ticketPrices: { ...tp, ...updates } });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h5 className="mb-2 text-xs font-medium text-muted-foreground">Attendee ticket prices</h5>
        <div className="grid gap-4 sm:grid-cols-3">
          <EditableNumberInput
            label="Price 1 ($)"
            value={tp.proposedPrice1}
            onChange={(v) => handleUpdate({ proposedPrice1: v })}
            min={0}
            readOnly={readOnly}
          />
          <EditableNumberInput
            label="Price 2 ($)"
            value={tp.proposedPrice2}
            onChange={(v) => handleUpdate({ proposedPrice2: v })}
            min={0}
            readOnly={readOnly}
          />
          <EditableNumberInput
            label="Price 3 ($)"
            value={tp.proposedPrice3}
            onChange={(v) => handleUpdate({ proposedPrice3: v })}
            min={0}
            readOnly={readOnly}
          />
        </div>
      </div>
      <div>
        <h5 className="mb-2 text-xs font-medium text-muted-foreground">Staff ticket prices</h5>
        <div className="grid gap-4 sm:grid-cols-3">
          <EditableNumberInput
            label="Staff Price 1 ($)"
            value={tp.staffPrice1}
            onChange={(v) => handleUpdate({ staffPrice1: v })}
            min={0}
            readOnly={readOnly}
          />
          <EditableNumberInput
            label="Staff Price 2 ($)"
            value={tp.staffPrice2}
            onChange={(v) => handleUpdate({ staffPrice2: v })}
            min={0}
            readOnly={readOnly}
          />
          <EditableNumberInput
            label="Staff Price 3 ($)"
            value={tp.staffPrice3}
            onChange={(v) => handleUpdate({ staffPrice3: v })}
            min={0}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
