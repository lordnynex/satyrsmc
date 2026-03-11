import { useState } from "react";
import {
  useIncidentsList,
  useEventIncidentUpdate,
  useEventIncidentDelete,
} from "@/queries/hooks";
import type { Incident } from "@satyrsmc/shared/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toDateTimeLocal, formatDateTime } from "@/lib/date-utils";

interface IncidentsResponse {
  items: Incident[];
  page: number;
  per_page: number;
  total: number;
}

export function IncidentsPanel() {
  const [page, setPage] = useState(1);
  const perPage = 25;
  const { data, isLoading: loading, refetch } = useIncidentsList(page, perPage);
  const updateIncidentMutation = useEventIncidentUpdate();
  const deleteIncidentMutation = useEventIncidentDelete();

  const [editIncident, setEditIncident] = useState<Incident | null>(null);
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dataAsResponse = data as IncidentsResponse | undefined;
  const totalPages = dataAsResponse
    ? Math.max(1, Math.ceil(dataAsResponse.total / dataAsResponse.per_page))
    : 1;

  const load = (targetPage: number) => {
    setPage(targetPage);
  };

  const openEdit = (incident: Incident) => {
    setEditIncident(incident);
    setType(incident.type);
    setSeverity(incident.severity);
    setSummary(incident.summary);
    setDetails(incident.details ?? "");
    setOccurredAt(toDateTimeLocal(incident.occurred_at) || "");
  };

  const resetEditState = () => {
    setEditIncident(null);
    setType("");
    setSeverity("");
    setSummary("");
    setDetails("");
    setOccurredAt("");
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!editIncident || !type || !severity || !summary) return;
    setSaving(true);
    try {
      await updateIncidentMutation.mutateAsync({
        eventId: editIncident.event_id,
        incidentId: editIncident.id,
        body: {
          type,
          severity,
          summary,
          details,
          occurred_at: occurredAt || null,
        },
      });
      resetEditState();
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (incident: Incident) => {
    if (!incident.event_id) return;
    if (!confirm("Delete this incident?")) return;
    setDeletingId(incident.id);
    try {
      await deleteIncidentMutation.mutateAsync({
        eventId: incident.event_id,
        incidentId: incident.id,
      });
      refetch();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All recorded incidents across events, newest first.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <p className="text-sm text-muted-foreground">Loading incidents...</p>
          ) : !dataAsResponse || dataAsResponse.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incidents recorded yet.</p>
          ) : (
            <>
              <div className="space-y-3">
                {dataAsResponse.items.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex flex-col gap-1 rounded-md border p-3 md:flex-row md:items-center md:gap-3"
                  >
                    <div className="md:w-[220px]">
                      {incident.event_id ? (
                        <Button
                          asChild
                          variant="link"
                          className="h-auto p-0 text-sm font-medium"
                        >
                          <Link to={`/events/${incident.event_id}#incidents`}>
                            {incident.event_name ?? incident.event_id}
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unknown event</span>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {incident.event_type}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={incident.summary}>
                        {incident.summary}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {incident.type} · {incident.severity}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end md:w-[260px]">
                      <div className="text-xs text-muted-foreground md:text-right">
                        <div>Occurred: {incident.occurred_at ? formatDateTime(incident.occurred_at) : "—"}</div>
                        <div>Logged: {incident.created_at ? formatDateTime(incident.created_at) : "—"}</div>
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
                          onClick={() => void handleDelete(incident)}
                          disabled={deletingId === incident.id}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(dataAsResponse.page - 1) * dataAsResponse.per_page + 1}–
                  {Math.min(dataAsResponse.page * dataAsResponse.per_page, dataAsResponse.total)} of {dataAsResponse.total}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => !loading && page > 1 && void load(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => !loading && page < totalPages && void load(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editIncident}
        onOpenChange={(open) => {
          if (!open) {
            resetEditState();
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
              <Input value={type} onChange={(e) => setType(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Input value={severity} onChange={(e) => setSeverity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
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
                resetEditState();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveEdit()}
              disabled={!type || !severity || !summary || saving}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

