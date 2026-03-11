import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { toDateTimeLocal, formatDateTime } from "@/lib/date-utils";
import type { Incident } from "@satyrsmc/shared/client";

interface EventIncidentsCardProps {
  incidents: Incident[];
  onAddIncident: (
    payload: {
      type: string;
      severity: string;
      summary: string;
      details?: string;
      occurred_at?: string;
    }
  ) => Promise<void>;
  onUpdateIncident: (
    incidentId: string,
    payload: {
      type?: string;
      severity?: string;
      summary?: string;
      details?: string;
      occurred_at?: string | null;
    }
  ) => Promise<void>;
  onDeleteIncident: (incidentId: string) => Promise<void>;
}

export function EventIncidentsCard({
  incidents,
  onAddIncident,
  onUpdateIncident,
  onDeleteIncident,
}: EventIncidentsCardProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [occurredAt, setOccurredAt] = useState("");

  const resetForm = () => {
    setType("");
    setSeverity("");
    setSummary("");
    setDetails("");
    setOccurredAt("");
  };

  const handleAdd = async () => {
    if (!type || !severity || !summary) return;
    await onAddIncident({
      type,
      severity,
      summary,
      details: details || undefined,
      occurred_at: occurredAt || undefined,
    });
    resetForm();
    setAddOpen(false);
  };

  const handleEdit = async (incident: Incident) => {
    if (!type || !severity || !summary) return;
    await onUpdateIncident(incident.id, {
      type,
      severity,
      summary,
      details,
      occurred_at: occurredAt || null,
    });
    setEditId(null);
    resetForm();
  };

  const openEdit = (incident: Incident) => {
    setEditId(incident.id);
    setType(incident.type);
    setSeverity(incident.severity);
    setSummary(incident.summary);
    setDetails(incident.details ?? "");
    setOccurredAt(toDateTimeLocal(incident.occurred_at) || "");
  };

  return (
    <Card id="incidents" className="scroll-mt-28">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="size-4 text-amber-500" />
              Incidents
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Log safety or other notable incidents associated with this event.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="size-4 mr-1" />
            Add incident
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No incidents recorded.</p>
        ) : (
          <ul className="space-y-3">
            {incidents.map((incident) => (
              <li
                key={incident.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{incident.summary}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {incident.type} · {incident.severity}
                        {incident.occurred_at && (
                          <> · {formatDateTime(incident.occurred_at)}</>
                        )}
                      </p>
                    </div>
                  </div>
                  {incident.details && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {incident.details}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(incident)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() =>
                      confirm("Delete this incident?") &&
                      onDeleteIncident(incident.id)
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={(open) => {
        setAddOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Injury, Mechanical, Behavior"
              />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Input
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                placeholder="e.g. Low, Medium, High, Critical"
              />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Short one-line description"
              />
            </div>
            <div className="space-y-2">
              <Label>Occurred at (optional)</Label>
              <Input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Details (optional)</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what happened, who was involved, and any actions taken."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!type || !severity || !summary}>
              Save incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editId}
        onOpenChange={(open) => {
          if (!open) {
            setEditId(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Input
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Occurred at (optional)</Label>
              <Input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Details (optional)</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditId(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const incident = editId
                  ? incidents.find((i) => i.id === editId)
                  : null;
                if (incident) {
                  void handleEdit(incident);
                }
              }}
              disabled={!type || !severity || !summary}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

