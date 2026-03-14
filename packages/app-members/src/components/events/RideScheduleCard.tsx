import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Plus, Pencil, Trash2 } from "lucide-react";
import type { RideScheduleItem } from "@satyrsmc/shared/client";
import { formatDateShort } from "@satyrsmc/shared/lib/date-utils";

interface RideScheduleCardProps {
  eventId: string;
  eventStartDate?: string | null;
  items: RideScheduleItem[];
  onAdd: (body: { scheduled_time: string; label: string; location?: string }) => Promise<void>;
  onUpdate: (
    scheduleId: string,
    body: { scheduled_time?: string; label?: string; location?: string | null },
  ) => Promise<void>;
  onDelete: (scheduleId: string) => Promise<void>;
}

/** Combine a YYYY-MM-DD date and HH:MM time into an ISO timestamp at noon-anchored UTC */
function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00Z`).toISOString();
}

/** Extract YYYY-MM-DD from an ISO string */
function extractDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Extract HH:MM from an ISO string */
function extractTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** Format an ISO timestamp for display: "Mar 14 at 9:00 AM" */
function formatScheduleTime(iso: string): string {
  const date = formatDateShort(iso);
  const d = new Date(iso);
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  const m = String(minutes).padStart(2, "0");
  return `${date} at ${h}:${m} ${ampm}`;
}

export function RideScheduleCard({
  eventId: _eventId,
  eventStartDate,
  items,
  onAdd,
  onUpdate,
  onDelete,
}: RideScheduleCardProps) {
  const defaultDate = eventStartDate ? extractDate(eventStartDate) : "";

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(defaultDate);
  const [newTime, setNewTime] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const handleAdd = async () => {
    if (!newDate || !newTime || !newLabel) return;
    await onAdd({
      scheduled_time: combineDateTime(newDate, newTime),
      label: newLabel,
      location: newLocation || undefined,
    });
    setNewDate(defaultDate);
    setNewTime("");
    setNewLabel("");
    setNewLocation("");
    setAddOpen(false);
  };

  const handleEdit = async (item: RideScheduleItem) => {
    if (!newDate || !newTime || !newLabel) return;
    await onUpdate(item.id, {
      scheduled_time: combineDateTime(newDate, newTime),
      label: newLabel,
      location: newLocation || null,
    });
    setEditId(null);
    setNewDate(defaultDate);
    setNewTime("");
    setNewLabel("");
    setNewLocation("");
  };

  const openEdit = (item: RideScheduleItem) => {
    setEditId(item.id);
    setNewDate(extractDate(item.scheduled_time));
    setNewTime(extractTime(item.scheduled_time));
    setNewLabel(item.label);
    setNewLocation(item.location ?? "");
  };

  const openAdd = () => {
    setNewDate(defaultDate);
    setNewTime("");
    setNewLabel("");
    setNewLocation("");
    setAddOpen(true);
  };

  const formFields = (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Date</Label>
          <DatePicker value={newDate} onChange={setNewDate} placeholder="Pick a date" />
        </div>
        <div className="space-y-2">
          <Label>Time</Label>
          <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Label</Label>
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="e.g. Meet at start, Kickstands up"
        />
      </div>
      <div className="space-y-2">
        <Label>Location (optional)</Label>
        <Input
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          placeholder="e.g. Lunch stop location"
        />
      </div>
    </div>
  );

  return (
    <Card id="ride-schedule">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Schedule</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Meet time, kickstands up, lunch stop, etc.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="size-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No schedule items yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                <Clock className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatScheduleTime(item.scheduled_time)}
                  </p>
                  {item.location && (
                    <p className="text-sm text-muted-foreground mt-1">{item.location}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => confirm("Delete this item?") && onDelete(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add schedule item</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!newDate || !newTime || !newLabel}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit schedule item</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const item = editId ? items.find((i) => i.id === editId) : null;
                if (item) handleEdit(item);
              }}
              disabled={!newDate || !newTime || !newLabel}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
