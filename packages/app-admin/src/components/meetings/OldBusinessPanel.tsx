import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useOldBusinessSuspense,
  useMeetingsOptional,
  useOldBusinessCreate,
  useOldBusinessUpdate,
  useOldBusinessDelete,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import type { OldBusinessItemWithMeeting } from "@satyrsmc/shared/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDateOnly } from "@/lib/date-utils";

export function OldBusinessPanel() {
  const items = unwrapSuspenseData(useOldBusinessSuspense()) ?? [];
  const { data: meetings = [] } = useMeetingsOptional();
  const createMutation = useOldBusinessCreate();
  const updateMutation = useOldBusinessUpdate();
  const deleteMutation = useOldBusinessDelete();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [meetingId, setMeetingId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const openItems = items.filter((ob) => ob.status === "open");
  const closedItems = items.filter((ob) => ob.status === "closed");
  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleCreate = async () => {
    const trimmed = description.trim();
    if (!trimmed || !meetingId) return;
    setSaving(true);
    try {
      await createMutation.mutateAsync({ meetingId, body: { description: trimmed } });
      setCreateOpen(false);
      setDescription("");
      setMeetingId("");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (ob: OldBusinessItemWithMeeting) => {
    const trimmed = description.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        meetingId: ob.meeting_id,
        id: ob.id,
        body: { description: trimmed },
      });
      setEditingId(null);
      setDescription("");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (ob: OldBusinessItemWithMeeting) => {
    await updateMutation.mutateAsync({
      meetingId: ob.meeting_id,
      id: ob.id,
      body: { status: "closed", closed_in_meeting_id: ob.meeting_id },
    });
  };

  const handleDelete = async (ob: OldBusinessItemWithMeeting) => {
    if (!confirm("Delete this open business item?")) return;
    await deleteMutation.mutateAsync({ meetingId: ob.meeting_id, id: ob.id });
  };

  const startEdit = (ob: OldBusinessItemWithMeeting) => {
    setEditingId(ob.id);
    setDescription(ob.description);
  };

  const meetingLabel = (m: { id: string; meeting_number: number; date: string }) =>
    `#${m.meeting_number} – ${formatDateOnly(m.date)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Open Business</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Add item
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Track discussion items carried from prior meetings. Add new items, edit descriptions, mark as resolved, or delete.
      </p>

      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-lg font-medium">Open items</h2>
          <ul className="space-y-2">
            {openItems.map((ob) => (
              <OldBusinessListItem
                key={ob.id}
                item={ob}
                meetings={sortedMeetings}
                editingId={editingId}
                description={description}
                setDescription={setDescription}
                onStartEdit={startEdit}
                onUpdate={handleUpdate}
                onClose={handleClose}
                onDelete={handleDelete}
                saving={saving}
                onCancelEdit={() => {
                  setEditingId(null);
                  setDescription("");
                }}
              />
            ))}
          </ul>
          {openItems.length === 0 && (
            <p className="text-sm text-muted-foreground">No open business items.</p>
          )}
        </div>

        {closedItems.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-medium">Resolved items</h2>
            <ul className="space-y-2">
              {closedItems.map((ob) => (
                <li
                  key={ob.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-muted bg-muted/30 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm line-through text-muted-foreground">{ob.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      From meeting #{ob.meeting_number} –{" "}
                      {ob.meeting_date
                        ? formatDateOnly(ob.meeting_date)
                        : "Unknown"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(ob)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add open business item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Meeting</Label>
              <Select value={meetingId} onValueChange={setMeetingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting" />
                </SelectTrigger>
                <SelectContent>
                  {sortedMeetings.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {meetingLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sortedMeetings.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Create a meeting first to add open business items.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Discussion item"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !description.trim() || !meetingId}
            >
              {saving ? "Adding..." : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OldBusinessListItem({
  item,
  meetings,
  editingId,
  description,
  setDescription,
  onStartEdit,
  onUpdate,
  onClose,
  onDelete,
  saving,
  onCancelEdit,
}: {
  item: OldBusinessItemWithMeeting;
  meetings: Array<{ id: string; meeting_number: number; date: string }>;
  editingId: string | null;
  description: string;
  setDescription: (v: string) => void;
  onStartEdit: (ob: OldBusinessItemWithMeeting) => void;
  onUpdate: (ob: OldBusinessItemWithMeeting) => void;
  onClose: (ob: OldBusinessItemWithMeeting) => void;
  onDelete: (ob: OldBusinessItemWithMeeting) => void;
  saving: boolean;
  onCancelEdit: () => void;
}) {
  const meeting = meetings.find((m) => m.id === item.meeting_id);
  const meetingLabel = meeting
    ? `#${meeting.meeting_number} – ${formatDateOnly(meeting.date)}`
    : "Unknown meeting";

  return (
    <li className="flex items-start justify-between gap-2 rounded-md border p-3">
      {editingId === item.id ? (
        <div className="flex flex-1 flex-col gap-2">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onUpdate(item)} disabled={saving}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <p className="text-sm">{item.description}</p>
            <Link
              to={`/meetings/${item.meeting_id}`}
              className="mt-1 inline-block text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              {meetingLabel}
            </Link>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onClose(item)}
              title="Mark resolved"
            >
              <Check className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onStartEdit(item)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(item)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </>
      )}
    </li>
  );
}
