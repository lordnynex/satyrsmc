import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Plus, Trash2, Users } from "lucide-react";
import type { Event, EventVolunteer } from "@satyrsmc/shared/client";

interface EventVolunteersCardProps {
  event: Event;
  onDelete: (vid: string) => Promise<void>;
  onAdd: (payload: { name: string; department: string }) => Promise<void>;
}

export function EventVolunteersCard({
  event,
  onDelete,
  onAdd,
}: EventVolunteersCardProps) {
  const [open, setOpen] = useState(false);
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerDept, setVolunteerDept] = useState("");

  const handleAdd = async () => {
    if (!volunteerName.trim() || !volunteerDept.trim()) return;
    await onAdd({ name: volunteerName.trim(), department: volunteerDept.trim() });
    setVolunteerName("");
    setVolunteerDept("");
    setOpen(false);
  };

  const volunteers = event.volunteers ?? [];
  const byDept = volunteers.reduce(
    (acc, v) => {
      (acc[v.department] ??= []).push(v);
      return acc;
    },
    {} as Record<string, EventVolunteer[]>
  );

  return (
    <>
      <Card id="volunteers" className="scroll-mt-28">
        <Collapsible defaultOpen className="group/collapsible">
          <CardHeader>
            <CollapsibleTrigger className="flex w-full items-center justify-between text-left hover:bg-muted/50 -m-4 p-4 rounded-lg transition-colors">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="size-4" />
                  Volunteers
                </CardTitle>
                <CardDescription>Volunteer roster and departments</CardDescription>
              </div>
              <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {volunteers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No volunteers yet.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(byDept).map(([dept, vols]) => (
                    <div key={dept}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">{dept}</h4>
                      <ul className="space-y-1">
                        {vols.map((v) => (
                          <li
                            key={v.id}
                            className="flex items-center justify-between rounded border px-3 py-2"
                          >
                            <span>{v.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onDelete(v.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                Add Volunteer
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Volunteer</DialogTitle>
            <CardDescription>Add a volunteer and their department</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={volunteerName} onChange={(e) => setVolunteerName(e.target.value)} placeholder="Volunteer name" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={volunteerDept} onChange={(e) => setVolunteerDept(e.target.value)} placeholder="e.g. Registration, Food, Setup" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
