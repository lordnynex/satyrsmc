import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useAppState } from "@/state/AppState";
import { useCreateScenario, useDeleteScenario, useUpdateScenario } from "@/queries/hooks";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScenarioInputsCard } from "./ScenarioInputsCard";

export function ScenariosPanel() {
  const { id: scenarioId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { scenarios, currentScenario, refreshScenarios, refreshScenario } = useAppState();
  const createScenarioMutation = useCreateScenario();
  const deleteScenarioMutation = useDeleteScenario();
  const updateScenarioMutation = useUpdateScenario();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<{
    id: string;
    name: string;
    description: string | null;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaved, setEditSaved] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await createScenarioMutation.mutateAsync({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
    });
    setNewName("");
    setNewDescription("");
    setCreateOpen(false);
    await refreshScenarios();
    navigate(`/budgeting/scenarios/${created.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this scenario?")) return;
    await deleteScenarioMutation.mutateAsync(id);
    await refreshScenarios();
    navigate("/budgeting/scenarios");
  };

  const openEdit = (s: { id: string; name: string; description: string | null }) => {
    setEditingScenario(s);
    setEditName(s.name);
    setEditDescription(s.description ?? "");
    setEditSaved(false);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingScenario || !editName.trim()) return;
    await updateScenarioMutation.mutateAsync({
      id: editingScenario.id,
      body: {
        name: editName.trim(),
        description: editDescription.trim(),
      },
    });
    await refreshScenarios();
    if (currentScenario?.id === editingScenario.id) {
      await refreshScenario(editingScenario.id);
    }
    setEditSaved(true);
    setTimeout(() => {
      setEditOpen(false);
      setEditingScenario(null);
      setEditSaved(false);
    }, 600);
  };

  if (scenarioId) {
    return (
      <ScenarioDetail
        scenarioId={scenarioId}
        onBack={() => navigate("/budgeting/scenarios")}
        onEdit={openEdit}
        onDelete={handleDelete}
        onSaveEdit={handleSaveEdit}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        editingScenario={editingScenario}
        setEditingScenario={setEditingScenario}
        editName={editName}
        setEditName={setEditName}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editSaved={editSaved}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scenarios</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage input variable sets for scenario testing.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Scenario
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {scenarios.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No scenarios yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/budgeting/scenarios/${s.id}`)}
                  >
                    <div>
                      <p className="font-medium">{s.name}</p>
                      {s.description && (
                        <p className="text-muted-foreground text-sm mt-1">{s.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(s)}
                        title="Edit scenario"
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/budgeting/scenarios/${s.id}`)}
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

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingScenario(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Conservative 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe this scenario..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              {editSaved ? (
                <>
                  <Check className="size-4" />
                  Saved
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Conservative 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe this scenario..."
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

function ScenarioDetail({
  scenarioId,
  onBack,
  onEdit,
  onDelete,
  onSaveEdit,
  editOpen,
  setEditOpen,
  editingScenario: _editingScenario,
  setEditingScenario,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editSaved,
}: {
  scenarioId: string;
  onBack: () => void;
  onEdit: (s: { id: string; name: string; description: string | null }) => void;
  onDelete: (id: string) => void;
  onSaveEdit: () => void;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editingScenario: { id: string; name: string; description: string | null } | null;
  setEditingScenario: (s: { id: string; name: string; description: string | null } | null) => void;
  editName: string;
  setEditName: (s: string) => void;
  editDescription: string;
  setEditDescription: (s: string) => void;
  editSaved: boolean;
}) {
  const { currentScenario } = useAppState();
  const handleEditDialogChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setEditingScenario(null);
  };

  if (!currentScenario || currentScenario.id !== scenarioId) {
    return (
      <div className="flex min-h-[280px] items-center justify-center p-6">
        <p className="text-muted-foreground">Loading scenario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to Scenarios
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onEdit(currentScenario)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => onDelete(currentScenario.id)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentScenario.name}</CardTitle>
          {currentScenario.description && (
            <CardDescription>{currentScenario.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      <ScenarioInputsCard />

      <Dialog open={editOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Conservative 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe this scenario..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSaveEdit}>
              {editSaved ? (
                <>
                  <Check className="size-4" />
                  Saved
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
