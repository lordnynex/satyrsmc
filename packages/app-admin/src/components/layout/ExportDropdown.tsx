import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Mail, Printer } from "lucide-react";
import { useAppState } from "@/state/AppState";

function downloadJson(data: {
  inputs: unknown;
  lineItems: unknown;
  budget: unknown;
  scenario: unknown;
}) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "badger-budget.json";
  a.click();
  URL.revokeObjectURL(url);
}

interface ExportDropdownProps {
  onPrint: () => void;
  onEmail: () => void;
}

export function ExportDropdown({ onPrint, onEmail }: ExportDropdownProps) {
  const { getInputs, getLineItems, currentBudget, currentScenario } = useAppState();
  const exportData = {
    inputs: getInputs(),
    lineItems: getLineItems(),
    budget: currentBudget,
    scenario: currentScenario,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadJson(exportData)}>
          <Download className="size-4" />
          Download JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPrint}>
          <Printer className="size-4" />
          Print
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEmail}>
          <Mail className="size-4" />
          Email-friendly
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
