import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, MapPin, DollarSign } from "lucide-react";
import type { Event } from "@satyrsmc/shared/client";

interface RideInfoCardProps {
  event: Event;
}

export function RideInfoCard({ event }: RideInfoCardProps) {
  const hasStart = !!event.start_location;
  const hasEnd = !!event.end_location;
  const hasFacebook = !!event.facebook_event_url;
  const hasCost = event.ride_cost != null && event.ride_cost > 0;

  if (!hasStart && !hasEnd && !hasFacebook && !hasCost) {
    return (
      <Card id="ride-info">
        <CardHeader>
          <CardTitle>Ride info</CardTitle>
          <p className="text-sm text-muted-foreground">
            Start/end locations, cost, and Facebook event link. Edit via the main Edit Event dialog.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No ride details added yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="ride-info">
      <CardHeader>
        <CardTitle>Ride info</CardTitle>
        <p className="text-sm text-muted-foreground">
          Start/end locations, cost, and Facebook event link.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {(hasStart || hasEnd) && (
          <div className="space-y-2">
            {hasStart && (
              <div className="flex gap-2">
                <MapPin className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Start</p>
                  <p className="text-sm">{event.start_location}</p>
                </div>
              </div>
            )}
            {hasEnd && (
              <div className="flex gap-2">
                <MapPin className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">End</p>
                  <p className="text-sm">{event.end_location}</p>
                </div>
              </div>
            )}
          </div>
        )}
        {hasCost && (
          <div className="flex gap-2">
            <DollarSign className="size-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Cost</p>
              <p className="text-sm">${event.ride_cost}</p>
            </div>
          </div>
        )}
        {hasFacebook && (
          <div className="flex gap-2">
            <ExternalLink className="size-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Facebook event</p>
              <a
                href={event.facebook_event_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View on Facebook
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
