import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import {
  useMembersOptional,
  useActionItemCreate,
  useActionItemUpdate,
  useActionItemDelete,
} from "@/queries/hooks";
import { toDateOnly, formatDateOnly } from "@/lib/date-utils";
import type { MeetingActionItem } from "@satyrsmc/shared/client";

interface ActionItemsCardProps {
  meetingId: string;
  actionItems: MeetingActionItem[];
}

export function ActionItemsCard({ meetingId, actionItems }: ActionItemsCardProps) {
  const { data: members = [] } = useMembersOptional();
  const createMutation = useActionItemCreate();
  const updateMutation = useActionItemUpdate();
  const deleteMutation = useActionItemDelete();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [assigneeMemberId, setAssigneeMemberId] = useState<string | "">("");
  const [dueDate, setDueDate] = useState("");

  const handleAdd = async () => {
    const trimmed = description.trim();
    if (!trimmed) return;
    await createMutation.mutateAsync({
      meetingId,
      body: {
        description: trimmed,
        assignee_member_id: assigneeMemberId || null,
        due_date: dueDate || null,
      },
    });
    setDescription("");
    setAssigneeMemberId("");
    setDueDate("");
    setAdding(false);
  };

  const handleUpdate = async (aid: string) => {
    const trimmed = description.trim();
    if (!trimmed) return;
    await updateMutation.mutateAsync({
      meetingId,
      actionItemId: aid,
      body: {
        description: trimmed,
        assignee_member_id: assigneeMemberId || null,
        due_date: dueDate || null,
      },
    });
    setEditingId(null);
    setDescription("");
    setAssigneeMemberId("");
    setDueDate("");
  };

  const handleComplete = async (aid: string) => {
    await updateMutation.mutateAsync({
      meetingId,
      actionItemId: aid,
      body: { status: "completed" },
    });
  };

  const handleDelete = async (aid: string) => {
    await deleteMutation.mutateAsync({ meetingId, actionItemId: aid });
  };

  const startEdit = (a: MeetingActionItem) => {
    setEditingId(a.id);
    setDescription(a.description ?? "");
    setAssigneeMemberId(a.assignee_member_id ?? "");
    setDueDate(toDateOnly(a.due_date) || "");
  };

  const formFields = (
    <>
      <Input
        placeholder="Action item description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="flex-1 min-w-[180px]"
      />
      <Select
        value={assigneeMemberId || "__unassigned__"}
        onValueChange={(v) => setAssigneeMemberId(v === "__unassigned__" ? "" : v)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unassigned__">Unassigned</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-[140px]"
      />
    </>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Action items</CardTitle>
        {!adding ? (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {formFields}
            <Button size="sm" onClick={handleAdd}>
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setDescription("");
                setAssigneeMemberId("");
                setDueDate("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {actionItems.map((a) => (
            <li
              key={a.id}
              className={`flex items-start justify-between gap-2 rounded-md border p-3 ${
                a.status === "completed" ? "opacity-60" : ""
              }`}
            >
              {editingId === a.id ? (
                <div className="flex flex-1 flex-wrap gap-2">
                  {formFields}
                  <Button size="sm" onClick={() => handleUpdate(a.id)}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setDescription("");
                      setAssigneeMemberId("");
                      setDueDate("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className={`text-sm ${a.status === "completed" ? "line-through" : ""}`}>
                      {a.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {a.assignee_name && <span>→ {a.assignee_name}</span>}
                      {a.due_date && <span>Due {formatDateOnly(a.due_date)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {a.status === "open" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleComplete(a.id)}
                        title="Mark complete"
                      >
                        <Check className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(a)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(a.id)}
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
        {actionItems.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">No action items.</p>
        )}
      </CardContent>
    </Card>
  );
}
