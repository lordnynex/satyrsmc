import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink, MapPin, Lock } from "lucide-react";
import type { Event } from "@satyrsmc/shared/client";
import { formatDateOnly } from "@/lib/date-utils";

interface EventDetailsCardProps {
  event: Event;
  budgetName?: string;
  scenarioName?: string;
}

export function EventDetailsCard({ event, budgetName, scenarioName }: EventDetailsCardProps) {
  return (
    <Card id="event-details" className="scroll-mt-28">
      <CardHeader>
        <CardTitle className="text-lg">Event Details</CardTitle>
        <CardDescription>Key information about this event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {event.members_only && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="size-3" />
            Members Only
          </Badge>
        )}
        {event.start_date && (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span>{formatDateOnly(event.start_date!)}</span>
          </div>
        )}
        {event.event_url && (
          <div className="flex items-center gap-2">
            <ExternalLink className="size-4 text-muted-foreground" />
            <a
              href={event.event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Event URL
            </a>
          </div>
        )}
        {event.event_location && (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <a
              href={event.event_location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View on Map
            </a>
          </div>
        )}
        {(event.ga_ticket_cost != null || event.day_pass_cost != null) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {event.ga_ticket_cost != null && (
              <div>
                <span className="text-muted-foreground">GA Ticket:</span> $
                {event.ga_ticket_cost.toLocaleString()}
              </div>
            )}
            {event.day_pass_cost != null && (
              <div>
                <span className="text-muted-foreground">Day Pass:</span> $
                {event.day_pass_cost.toLocaleString()}
              </div>
            )}
          </div>
        )}
        {(event.ga_tickets_sold != null || event.day_passes_sold != null) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {event.ga_tickets_sold != null && (
              <div>
                <span className="text-muted-foreground">GA Sold:</span> {event.ga_tickets_sold}
              </div>
            )}
            {event.day_passes_sold != null && (
              <div>
                <span className="text-muted-foreground">Day Passes Sold:</span>{" "}
                {event.day_passes_sold}
              </div>
            )}
          </div>
        )}
        {(event.budget_id || event.scenario_id) && (
          <div className="space-y-2 text-sm">
            {event.budget_id && (
              <div>
                <span className="text-muted-foreground">Budget:</span>{" "}
                {budgetName ?? event.budget_id}
              </div>
            )}
            {event.scenario_id && (
              <div>
                <span className="text-muted-foreground">Scenario:</span>{" "}
                {scenarioName ?? event.scenario_id}
              </div>
            )}
          </div>
        )}
        {event.description && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap text-sm">{event.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
