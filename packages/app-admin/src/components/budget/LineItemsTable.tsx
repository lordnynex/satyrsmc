import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileInput } from "lucide-react";
import { useAppState } from "@/state/AppState";
import { LineItemRow } from "./LineItemRow";
import { ImportLineItemsModal } from "./ImportLineItemsModal";
import type { LineItem } from "@satyrsmc/shared/client";

export function LineItemsTable() {
  const {
    getLineItems,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    addCategory,
    categories,
    selectedBudgetId,
    currentBudget,
    budgets,
    refreshBudget,
  } = useAppState();
  const lineItems = getLineItems();
  const [importOpen, setImportOpen] = useState(false);

  const handleImport = async (items: Omit<LineItem, "id">[]) => {
    if (!selectedBudgetId) return;
    for (const item of items) {
      await addLineItem(selectedBudgetId, item);
    }
    await refreshBudget(selectedBudgetId);
  };

  if (!selectedBudgetId || !currentBudget) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Select a budget above to view and edit line items.
        </CardContent>
      </Card>
    );
  }

  const total = lineItems.reduce((sum, li) => sum + li.unitCost * li.quantity, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budget Line Items</CardTitle>
          <CardDescription>
            Add, edit, or remove expense items. Use unit cost and quantity for variable costs.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            title="Import line items from another budget"
          >
            <FileInput className="size-4" />
            Import
          </Button>
          <Button onClick={() => addLineItem(selectedBudgetId)} size="sm">
            <Plus className="size-4" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left font-medium">Name</th>
                <th className="p-2 text-left font-medium">Unit Cost</th>
                <th className="p-2 text-left font-medium">Qty</th>
                <th className="p-2 text-right font-medium">Total</th>
                <th className="p-2 text-left font-medium">Category</th>
                <th className="p-2 text-left font-medium">Comments</th>
                <th className="p-2 min-w-[72px]" />
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  categories={categories}
                  onUpdate={(id, updates) => updateLineItem(selectedBudgetId, id, updates)}
                  onDelete={(id) => deleteLineItem(selectedBudgetId, id)}
                  onAddCategory={addCategory}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end border-t pt-4">
          <span className="text-lg font-semibold">
            Total: ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </CardContent>
      <ImportLineItemsModal
        open={importOpen}
        onOpenChange={setImportOpen}
        currentBudgetId={selectedBudgetId}
        budgets={budgets}
        onImport={handleImport}
      />
    </Card>
  );
}
