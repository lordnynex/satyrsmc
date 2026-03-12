import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
interface BudgetSummary {
  id: string;
  name: string;
  year: number;
}

interface ScenarioSummary {
  id: string;
  name: string;
}

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editName: string;
  setEditName: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editYear: number | "";
  setEditYear: (v: number | "") => void;
  editEventDate: string;
  setEditEventDate: (v: string) => void;
  editEventUrl: string;
  setEditEventUrl: (v: string) => void;
  editEventLocation: string;
  setEditEventLocation: (v: string) => void;
  editEventLocationEmbed: string;
  setEditEventLocationEmbed: (v: string) => void;
  editGaTicketCost: string;
  setEditGaTicketCost: (v: string) => void;
  editDayPassCost: string;
  setEditDayPassCost: (v: string) => void;
  editGaTicketsSold: string;
  setEditGaTicketsSold: (v: string) => void;
  editDayPassesSold: string;
  setEditDayPassesSold: (v: string) => void;
  editBudgetId: string;
  setEditBudgetId: (v: string) => void;
  editScenarioId: string;
  setEditScenarioId: (v: string) => void;
  editPlanningNotes: string;
  setEditPlanningNotes: (v: string) => void;
  editEventType: string;
  setEditEventType: (v: string) => void;
  editStartLocation: string;
  setEditStartLocation: (v: string) => void;
  editEndLocation: string;
  setEditEndLocation: (v: string) => void;
  editFacebookEventUrl: string;
  setEditFacebookEventUrl: (v: string) => void;
  editPreRideEventId: string;
  setEditPreRideEventId: (v: string) => void;
  editRideCost: string;
  setEditRideCost: (v: string) => void;
  editShowOnWebsite: boolean;
  setEditShowOnWebsite: (v: boolean) => void;
  budgets: BudgetSummary[];
  scenarios: ScenarioSummary[];
  onSave: () => Promise<void>;
}

export function EditEventDialog({
  open,
  onOpenChange,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editYear,
  setEditYear,
  editEventDate,
  setEditEventDate,
  editEventUrl,
  setEditEventUrl,
  editEventLocation,
  setEditEventLocation,
  editEventLocationEmbed,
  setEditEventLocationEmbed,
  editGaTicketCost,
  setEditGaTicketCost,
  editDayPassCost,
  setEditDayPassCost,
  editGaTicketsSold,
  setEditGaTicketsSold,
  editDayPassesSold,
  setEditDayPassesSold,
  editBudgetId,
  setEditBudgetId,
  editScenarioId,
  setEditScenarioId,
  editPlanningNotes,
  setEditPlanningNotes,
  editEventType,
  setEditEventType,
  editStartLocation,
  setEditStartLocation,
  editEndLocation,
  setEditEndLocation,
  editFacebookEventUrl,
  setEditFacebookEventUrl,
  editPreRideEventId,
  setEditPreRideEventId,
  editRideCost,
  setEditRideCost,
  editShowOnWebsite,
  setEditShowOnWebsite,
  budgets,
  scenarios,
  onSave,
}: EditEventDialogProps) {
  const handleSave = async () => {
    await onSave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden max-w-3xl w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <CardDescription>Update event details</CardDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 min-w-0 overflow-hidden">
          <div className="grid gap-4 sm:grid-cols-2 min-w-0">
            <div className="space-y-2 min-w-0">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Event name"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label>Event type</Label>
              <Select value={editEventType} onValueChange={setEditEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="badger">Badger</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="pioneer_run">Pioneer Run</SelectItem>
                  <SelectItem value="rides">Rides</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 min-w-0">
            <div className="space-y-2 min-w-0">
              <Label>Year</Label>
              <Input
                type="number"
                value={editYear}
                onChange={(e) =>
                  setEditYear(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                }
                placeholder="2025"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label>Event Date</Label>
              <Input
                type="date"
                value={editEventDate}
                onChange={(e) => setEditEventDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2 min-w-0">
            <Label>Event URL</Label>
            <Input
              value={editEventUrl}
              onChange={(e) => setEditEventUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2 min-w-0">
            <Label>Event Location (Google Maps link)</Label>
            <Input
              value={editEventLocation}
              onChange={(e) => setEditEventLocation(e.target.value)}
              placeholder="https://maps.google.com/... or maps.app.goo.gl/..."
            />
          </div>
          <div className="space-y-2 min-w-0">
            <Label>Map Embed (optional)</Label>
            <Textarea
              value={editEventLocationEmbed}
              onChange={(e) => setEditEventLocationEmbed(e.target.value)}
              placeholder="Paste the iframe HTML from Google Maps (Share → Embed a map). Overrides the link above for the mini map."
              rows={3}
              className="font-mono text-sm w-full min-w-0 overflow-x-auto"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>GA Ticket Cost ($)</Label>
              <Input
                type="number"
                value={editGaTicketCost}
                onChange={(e) => setEditGaTicketCost(e.target.value)}
                placeholder="200"
              />
            </div>
            <div className="space-y-2">
              <Label>Day Pass Cost ($)</Label>
              <Input
                type="number"
                value={editDayPassCost}
                onChange={(e) => setEditDayPassCost(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>GA Tickets Sold</Label>
              <Input
                type="number"
                value={editGaTicketsSold}
                onChange={(e) => setEditGaTicketsSold(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Day Passes Sold</Label>
              <Input
                type="number"
                value={editDayPassesSold}
                onChange={(e) => setEditDayPassesSold(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Budget</Label>
              <Select
                value={editBudgetId || "none"}
                onValueChange={(v) => setEditBudgetId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {budgets.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scenario</Label>
              <Select
                value={editScenarioId || "none"}
                onValueChange={(v) => setEditScenarioId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {scenarios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(editEventType === "rides" ||
            editStartLocation ||
            editEndLocation ||
            editFacebookEventUrl ||
            editRideCost) && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">Ride details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start location</Label>
                  <Input
                    value={editStartLocation}
                    onChange={(e) => setEditStartLocation(e.target.value)}
                    placeholder="Meet location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End location</Label>
                  <Input
                    value={editEndLocation}
                    onChange={(e) => setEditEndLocation(e.target.value)}
                    placeholder="Final destination"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Facebook event URL</Label>
                <Input
                  value={editFacebookEventUrl}
                  onChange={(e) => setEditFacebookEventUrl(e.target.value)}
                  placeholder="https://facebook.com/events/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Ride cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editRideCost}
                  onChange={(e) => setEditRideCost(e.target.value)}
                  placeholder="0 or leave empty for free"
                />
              </div>
              <div className="space-y-2">
                <Label>Pre-ride event ID</Label>
                <Input
                  value={editPreRideEventId}
                  onChange={(e) => setEditPreRideEventId(e.target.value)}
                  placeholder="Event ID of pre-ride (optional)"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Planning Notes</Label>
            <Textarea
              value={editPlanningNotes}
              onChange={(e) => setEditPlanningNotes(e.target.value)}
              placeholder="Free-form notes..."
              rows={4}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editShowOnWebsite}
              onChange={(e) => setEditShowOnWebsite(e.target.checked)}
              className="size-4 rounded border-input"
            />
            <span className="text-sm font-medium">Show on website</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
