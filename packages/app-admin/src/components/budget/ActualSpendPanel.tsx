import { BarChart3 } from "lucide-react";

export function ActualSpendPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Actual Spend</h1>
        <p className="mt-1 text-muted-foreground">
          Budget variance review — compare budgeted amounts to actual spend and see how close the
          budget was to reality.
        </p>
      </div>
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8">
        <BarChart3 className="size-12 text-muted-foreground/50" />
        <p className="mt-4 text-center text-muted-foreground">
          This section is under construction. Budget variance review will be available here soon.
        </p>
      </div>
    </div>
  );
}
