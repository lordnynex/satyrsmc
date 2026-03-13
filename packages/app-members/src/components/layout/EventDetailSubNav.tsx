import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventType } from "@satyrsmc/shared/client";

const ALL_SECTIONS = [
  { id: "event-details", label: "Details", rides: true },
  { id: "ride-info", label: "Ride info", rides: true },
  { id: "ride-schedule", label: "Schedule", rides: true },
  { id: "location", label: "Location", rides: true },
  { id: "milestones", label: "Milestones", rides: false },
  { id: "assignments", label: "Assignments", rides: false },
  { id: "packing", label: "Packing", rides: false },
  { id: "volunteers", label: "Volunteers", rides: false },
  { id: "ride-attendees", label: "Attendees", rides: true },
  { id: "ride-assets", label: "Flyers", rides: true },
  { id: "event-photos", label: "Event photos", rides: true },
  { id: "notes", label: "Notes", rides: true },
] as const;

interface EventDetailSubNavProps {
  className?: string;
  eventType?: EventType;
}

export function EventDetailSubNav({ className, eventType }: EventDetailSubNavProps) {
  const sections = eventType === "rides" ? ALL_SECTIONS.filter((s) => s.rides) : ALL_SECTIONS;

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
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap shrink-0"
          >
            {label}
          </a>
        ))}
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
