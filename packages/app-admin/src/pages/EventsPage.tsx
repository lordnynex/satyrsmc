import { EventsPanel } from "@/components/events/EventsPanel";
import type { EventType } from "@satyrsmc/shared/client";

/** Events list page: optionally filtered by type. */
export function EventsPage({
  type,
}: {
  type?: EventType;
}) {
  return <EventsPanel type={type} />;
}
