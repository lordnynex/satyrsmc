import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventType } from "@satyrsmc/shared/lib/enums";

const ALL_TYPES = [EventType.Badger, EventType.Anniversary, EventType.PioneerRun, EventType.Rides];
const NON_RIDES = [EventType.Badger, EventType.Anniversary, EventType.PioneerRun];

const ALL_SECTIONS: { id: string; label: string; types: EventType[]; route?: boolean }[] = [
  { id: "event-details", label: "Details", types: ALL_TYPES },
  { id: "ride-info", label: "Ride info", types: [EventType.Rides] },
  { id: "ride-schedule", label: "Schedule", types: ALL_TYPES },
  { id: "location", label: "Location", types: ALL_TYPES },
  { id: "milestones", label: "Milestones", types: NON_RIDES },
  { id: "assignments", label: "Assignments", types: NON_RIDES },
  { id: "packing", label: "Packing", types: NON_RIDES },
  { id: "volunteers", label: "Volunteers", types: NON_RIDES },
  { id: "ride-attendees", label: "Attendees", types: ALL_TYPES, route: true },
  { id: "registrations", label: "Registrations", types: ALL_TYPES },
  { id: "ride-assets", label: "Flyers", types: ALL_TYPES },
  { id: "event-photos", label: "Event photos", types: ALL_TYPES },
  { id: "notes", label: "Notes", types: ALL_TYPES },
];

interface EventDetailSubNavProps {
  className?: string;
  eventType?: EventType;
}

export function EventDetailSubNav({ className, eventType }: EventDetailSubNavProps) {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const sections = eventType
    ? ALL_SECTIONS.filter((s) => s.types.includes(eventType))
    : ALL_SECTIONS;

  return (
    <div
      className={cn(
        "sticky top-14 z-30 flex flex-wrap items-center justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <nav
        className="flex items-center gap-1 overflow-x-auto min-w-0 shrink"
        aria-label="Event detail page sections"
      >
        {sections.map(({ id, label, route }) =>
          route && eventId ? (
            <button
              key={id}
              type="button"
              onClick={() => navigate(`/admin/events/${eventId}/attendees`)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap shrink-0 cursor-pointer"
            >
              {label}
            </button>
          ) : (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap shrink-0"
            >
              {label}
            </a>
          ),
        )}
      </nav>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
      >
        <ChevronUp className="size-4" />
      </Button>
    </div>
  );
}
