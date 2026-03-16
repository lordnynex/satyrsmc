import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEventsSuspense, useInvalidateQueries, unwrapSuspenseData } from "@/queries/hooks";
import { EVENT_TYPE_LABELS } from "@/lib/event-constants";
import { Calendar, ChevronRight, BarChart3, Plus } from "lucide-react";
import { AddEventDialog } from "./AddEventDialog";
import { EventType } from "@satyrsmc/shared/client";
import { formatDateOnly } from "@/lib/date-utils";

interface EventsPanelProps {
  type?: EventType;
}

export function EventsPanel({ type }: EventsPanelProps) {
  const navigate = useNavigate();
  const invalidate = useInvalidateQueries();
  const [addOpen, setAddOpen] = useState(false);
  const events = unwrapSuspenseData(useEventsSuspense(type)) ?? [];

  const title = type ? EVENT_TYPE_LABELS[type] : "Events";
  const description = type
    ? `${title} events. Click an event to view details.`
    : "Badger events across years. Click an event to view details, plan milestones, manage volunteers, and more.";

  const handleCreateSuccess = (eventId: string) => {
    invalidate.invalidateEvents();
    navigate(`/admin/events/${eventId}`);
  };

  return (
    <div className="space-y-6">
      {type === "rides" && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="size-12 text-muted-foreground/50 mb-4" />
            <p className="text-center text-muted-foreground">
              Historical attendance graphs will be available here.
            </p>
          </CardContent>
        </Card>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4 mr-2" />
          Create event
        </Button>
      </div>

      <AddEventDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={handleCreateSuccess}
        defaultEventType={type ?? EventType.Badger}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <Card
            key={e.id}
            className="overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.99]"
            onClick={() => navigate(`/admin/events/${e.id}`)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg truncate">{e.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {e.year != null && <span>{e.year}</span>}
                    {e.start_date && (
                      <>
                        <span className="text-border">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {formatDateOnly(e.start_date!)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </div>
            </CardHeader>
            {e.description && (
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm line-clamp-2">{e.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      {events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No events yet. Create an event to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
