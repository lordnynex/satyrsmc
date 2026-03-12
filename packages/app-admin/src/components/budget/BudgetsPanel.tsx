import { useState, type Dispatch, type SetStateAction } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { useAppState } from "@/state/AppState";
import { useCreateBudget, useDeleteBudget, useUpdateBudget } from "@/queries/hooks";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LineItemsTable } from "./LineItemsTable";

export function BudgetsPanel() {
  const { id: budgetId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { budgets, currentBudget, refreshBudgets, refreshBudget } = useAppState();
  const createBudgetMutation = useCreateBudget();
  const deleteBudgetMutation = useDeleteBudget();
  const updateBudgetMutation = useUpdateBudget();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newDescription, setNewDescription] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{
    id: string;
    name: string;
    year: number;
    description: string | null;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await createBudgetMutation.mutateAsync({
      name: newName.trim(),
      year: newYear,
      description: newDescription.trim() || undefined,
    });
    setNewName("");
    setNewYear(new Date().getFullYear());
    setNewDescription("");
    setCreateOpen(false);
    await refreshBudgets();
    navigate(`/budgeting/budget/${created.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this budget and all its line items?")) return;
    await deleteBudgetMutation.mutateAsync(id);
    await refreshBudgets();
    navigate("/budgeting/budget");
  };

  const openEdit = (b: { id: string; name: string; year: number; description: string | null }) => {
    setEditingBudget(b);
    setEditName(b.name);
    setEditDescription(b.description ?? "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBudget || !editName.trim()) return;
    await updateBudgetMutation.mutateAsync({
      id: editingBudget.id,
      body: {
        name: editName.trim(),
        description: editDescription.trim(),
      },
    });
    await refreshBudgets();
    if (currentBudget?.id === editingBudget.id) {
      await refreshBudget(editingBudget.id);
    }
    setEditOpen(false);
    setEditingBudget(null);
  };

  if (budgetId) {
    return (
      <BudgetDetail
        budgetId={budgetId}
        onBack={() => navigate("/budgeting/budget")}
        onEdit={openEdit}
        onDelete={handleDelete}
        onSaveEdit={handleSaveEdit}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        editingBudget={editingBudget}
        setEditingBudget={setEditingBudget}
        editName={editName}
        setEditName={setEditName}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage budgets. Each budget has its own line items.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Budget
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {budgets.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No budgets yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {budgets.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/budgeting/budget/${b.id}`)}
                  >
                    <div>
                      <p className="font-medium">
                        {b.name} ({b.year})
                      </p>
                      {b.description && (
                        <p className="text-muted-foreground text-sm mt-1">{b.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(b)}
                        title="Edit budget"
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/budgeting/budget/${b.id}`)}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Badger South 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe this budget..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Badger South 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={newYear}
                onChange={(e) =>
                  setNewYear(parseInt(e.target.value, 10) || new Date().getFullYear())
                }
                min={2000}
                max={2100}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe this budget..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BudgetDetail({
  budgetId,
  onBack,
  onEdit,
  onDelete,
  onSaveEdit,
  editOpen,
  setEditOpen,
  editingBudget: _editingBudget,
  setEditingBudget,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
}: {
  budgetId: string;
  onBack: () => void | Promise<void>;
  onEdit: (b: { id: string; name: string; year: number; description: string | null }) => void;
  onDelete: (id: string) => void | Promise<void>;
  onSaveEdit: () => void | Promise<void>;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editingBudget: { id: string; name: string; year: number; description: string | null } | null;
  setEditingBudget: (
    b: { id: string; name: string; year: number; description: string | null } | null,
  ) => void;
  editName: string;
  setEditName: Dispatch<SetStateAction<string>>;
  editDescription: string;
  setEditDescription: Dispatch<SetStateAction<string>>;
}) {
  const { currentBudget } = useAppState();
  const handleEditDialogChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setEditingBudget(null);
  };

  if (!currentBudget || currentBudget.id !== budgetId) {
    return (
      <div className="flex min-h-[280px] items-center justify-center p-6">
        <p className="text-muted-foreground">Loading budget...</p>
      </div>
    );
  }

  const lineItems = currentBudget.lineItems ?? [];
  const total = lineItems.reduce((sum, li) => sum + li.unitCost * li.quantity, 0);
  const categoryTotals = lineItems.reduce(
    (acc, li) => {
      const itemTotal = li.unitCost * li.quantity;
      const cat = li.category || "Uncategorized";
      acc[cat] = (acc[cat] ?? 0) + itemTotal;
      return acc;
    },
    {} as Record<string, number>,
  );
  const categories = Object.keys(categoryTotals).sort();

  const formatCurrency = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to Budgets
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              onEdit({
                id: currentBudget.id,
                name: currentBudget.name,
                year: currentBudget.year,
                description: currentBudget.description ?? null,
              })
            }
          >
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => onDelete(currentBudget.id)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentBudget.name} ({currentBudget.year})
          </CardTitle>
          {currentBudget.description && (
            <CardDescription>{currentBudget.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription>Total cost and breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline justify-between border-b pb-3">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">${formatCurrency(total)}</span>
            </div>
            {categories.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">By category</p>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <tbody>
                      {categories.map((cat) => (
                        <tr key={cat} className="border-b last:border-0">
                          <td className="p-2 font-medium">{cat}</td>
                          <td className="p-2 text-right">${formatCurrency(categoryTotals[cat])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No line items yet. Add items below to see the breakdown.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <LineItemsTable />

      <Dialog open={editOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Badger South 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe this budget..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
