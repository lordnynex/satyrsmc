import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import { useOldBusinessCreate, useOldBusinessUpdate, useOldBusinessDelete } from "@/queries/hooks";
import type { OldBusinessItem } from "@satyrsmc/shared/client";

interface OldBusinessCardProps {
  meetingId: string;
  oldBusiness: OldBusinessItem[];
}

export function OldBusinessCard({ meetingId, oldBusiness }: OldBusinessCardProps) {
  const createMutation = useOldBusinessCreate();
  const updateMutation = useOldBusinessUpdate();
  const deleteMutation = useOldBusinessDelete();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const handleAdd = async () => {
    const trimmed = description.trim();
    if (!trimmed) return;
    await createMutation.mutateAsync({ meetingId, body: { description: trimmed } });
    setDescription("");
    setAdding(false);
  };

  const handleUpdate = async (oid: string) => {
    const trimmed = description.trim();
    if (!trimmed) return;
    await updateMutation.mutateAsync({
      meetingId,
      id: oid,
      body: { description: trimmed },
    });
    setEditingId(null);
    setDescription("");
  };

  const handleClose = async (oid: string) => {
    await updateMutation.mutateAsync({
      meetingId,
      id: oid,
      body: { status: "closed", closed_in_meeting_id: meetingId },
    });
  };

  const handleDelete = async (oid: string) => {
    await deleteMutation.mutateAsync({ meetingId, id: oid });
  };

  const startEdit = (ob: OldBusinessItem) => {
    setEditingId(ob.id);
    setDescription(ob.description);
  };

  const openItems = oldBusiness.filter((ob) => ob.status === "open");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Old business</CardTitle>
        {!adding ? (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Discussion item"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-w-[200px]"
            />
            <Button size="sm" onClick={handleAdd}>
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setDescription("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Open items from prior meetings are carried forward. Add new items or close them when
          resolved.
        </p>
        <ul className="space-y-2">
          {openItems.map((ob) => (
            <li
              key={ob.id}
              className="flex items-start justify-between gap-2 rounded-md border p-3"
            >
              {editingId === ob.id ? (
                <div className="flex flex-1 gap-2">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => handleUpdate(ob.id)}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setDescription("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-sm">{ob.description}</p>
                    {ob.is_carried && (
                      <span className="mt-1 inline-block text-xs text-muted-foreground">
                        Carried from prior meeting
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleClose(ob.id)}
                      title="Mark resolved"
                    >
                      <Check className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(ob)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(ob.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        {openItems.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">No open old business items.</p>
        )}
      </CardContent>
    </Card>
  );
}
