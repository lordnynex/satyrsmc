import { useEventsOptional, useWebsiteEventsFeed, useUpdateEvent } from "@/queries/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { EventType } from "@satyrsmc/shared/client";

interface EventSummary {
  id: string;
  name: string;
  year?: number | null;
  event_date?: string | null;
  event_type?: EventType;
  show_on_website?: boolean;
}

export function WebsiteEventsFeedPanel() {
  const { data: events = [], isLoading } = useEventsOptional();
  const { data: feedEvents = [] } = useWebsiteEventsFeed();
  const updateMutation = useUpdateEvent();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Events feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Toggle which events appear on the public site. Events with &quot;Show on website&quot;
            on will be included in the public feed at{" "}
            <code className="text-xs bg-muted px-1 rounded">/api/website/events</code>.
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-3">
              {(events as EventSummary[]).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <span className="font-medium">{event.name}</span>
                    {event.year != null && (
                      <span className="ml-2 text-muted-foreground text-sm">{event.year}</span>
                    )}
                    {event.event_type && event.event_type !== EventType.Badger && (
                      <span className="ml-2 text-muted-foreground text-sm">
                        ({event.event_type})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`event-${event.id}`}
                      checked={(event as EventSummary).show_on_website ?? false}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: event.id,
                          body: { show_on_website: e.target.checked },
                        })
                      }
                      disabled={updateMutation.isPending}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor={`event-${event.id}`} className="text-sm">
                      Show on website
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
          {feedEvents.length > 0 && (
            <div className="mt-6 rounded-md border bg-muted/30 p-3">
              <p className="text-sm font-medium mb-2">
                Public feed preview ({feedEvents.length} events)
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {(feedEvents as { id: string; name: string; year?: number }[])
                  .slice(0, 5)
                  .map((e) => (
                    <li key={e.id}>
                      {e.name} {e.year != null ? `(${e.year})` : ""}
                    </li>
                  ))}
                {feedEvents.length > 5 && <li>…and {feedEvents.length - 5} more</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
