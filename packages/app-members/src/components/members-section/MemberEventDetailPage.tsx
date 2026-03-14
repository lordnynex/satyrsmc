import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  User,
  Check,
  X,
  Clock,
  Tent,
  ExternalLink,
  Pencil,
  Copy,
} from "lucide-react";
import { RsvpStatus } from "@satyrsmc/shared/client";
import type { MemberEventDetail, MemberEventAttendee } from "@satyrsmc/shared/dto/member/event";
import { formatDateLong, formatDateOnly } from "@/lib/date-utils";
import { useMemberEventDetail, useMemberEventRsvp } from "@/queries/member-events";
import { useCreateEvent } from "@/queries/hooks";
import { useAuth } from "@/state/AuthContext";
import { EVENT_TYPE_LABELS } from "@/lib/event-constants";
import { getStaticMapUrl } from "@/lib/maps";
import { SafeHtml } from "@/components/SafeHtml";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";

declare const __BUILD_GOOGLE_MAPS_API_KEY__: string;
const GOOGLE_MAPS_API_KEY: string | undefined =
  typeof __BUILD_GOOGLE_MAPS_API_KEY__ !== "undefined" ? __BUILD_GOOGLE_MAPS_API_KEY__ : undefined;

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="aspect-[16/7] w-full rounded-lg" />
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="hidden lg:block w-[35%] space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Attendee card ───────────────────────────────────────────────────────────

function AttendeeCard({ attendee }: { attendee: MemberEventAttendee }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="size-10 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
        {attendee.photo_thumbnail_url ? (
          <img src={attendee.photo_thumbnail_url} alt="" className="size-full object-cover" />
        ) : (
          <User className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{attendee.display_name}</p>
        <p className="text-sm text-muted-foreground">{attendee.is_member ? "Member" : "Guest"}</p>
      </div>
    </div>
  );
}

// ─── RSVP Sheet ──────────────────────────────────────────────────────────────

function RsvpSheet({
  event,
  open,
  onOpenChange,
}: {
  event: MemberEventDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rsvpMutation = useMemberEventRsvp();
  const [waiverAccepted, setWaiverAccepted] = useState(false);

  const hasExistingRsvp = event.my_rsvp !== null && event.my_rsvp !== RsvpStatus.NoResponse;
  const alreadyGoing = event.my_rsvp === RsvpStatus.Yes;
  const canRsvpYes = alreadyGoing || waiverAccepted;

  const handleRsvp = (status: RsvpStatus) => {
    if (status === RsvpStatus.Yes && !canRsvpYes) return;
    rsvpMutation.mutate(
      { eventId: event.id, status, waiver_signed: waiverAccepted || undefined },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full max-w-md sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>RSVP</SheetTitle>
          <SheetDescription>{event.name}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-6">
          {hasExistingRsvp && (
            <div className="text-sm">
              Current status:{" "}
              <Badge variant={event.my_rsvp === RsvpStatus.Yes ? "success" : "destructive"}>
                {event.my_rsvp === RsvpStatus.Yes ? "Going" : "Not Going"}
              </Badge>
            </div>
          )}

          {!alreadyGoing && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Waiver</p>
              <div className="rounded border border-border bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
                By RSVPing to this event, I acknowledge that I participate voluntarily and at my own
                risk. I agree to follow all event rules and guidelines, and I release the organizers
                from any liability for injury or loss during the event.
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={waiverAccepted}
                  onChange={(e) => setWaiverAccepted(e.target.checked)}
                  className="rounded border-border"
                />
                I accept the waiver
              </label>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium">Are you going?</p>
            <Button
              size="lg"
              variant={event.my_rsvp === RsvpStatus.Yes ? "default" : "outline"}
              className={`w-full gap-2 ${event.my_rsvp === RsvpStatus.Yes ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
              disabled={!canRsvpYes || rsvpMutation.isPending}
              onClick={() => handleRsvp(RsvpStatus.Yes)}
            >
              <Check className="size-5" />
              Yes, I'm going
            </Button>
            <Button
              size="lg"
              variant={event.my_rsvp === RsvpStatus.No ? "default" : "outline"}
              className={`w-full gap-2 ${event.my_rsvp === RsvpStatus.No ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
              disabled={rsvpMutation.isPending}
              onClick={() => handleRsvp(RsvpStatus.No)}
            >
              <X className="size-5" />
              No, can't make it
            </Button>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ event, onOpenRsvp }: { event: MemberEventDetail; onOpenRsvp: () => void }) {
  const hostAttendees = event.attendees.filter((a) => event.host_ids.includes(a.contact_id));

  const directionsUrl = event.event_location
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.event_location)}`
    : null;

  const staticMapUrl = getStaticMapUrl(event.event_location, GOOGLE_MAPS_API_KEY ?? null);

  const hasExistingRsvp = event.my_rsvp !== null && event.my_rsvp !== RsvpStatus.NoResponse;

  return (
    <div className="space-y-4">
      {/* RSVP CTA */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Are you going?</p>
        {hasExistingRsvp && (
          <div className="text-sm">
            Status:{" "}
            <Badge variant={event.my_rsvp === RsvpStatus.Yes ? "success" : "destructive"}>
              {event.my_rsvp === RsvpStatus.Yes ? "Going" : "Not Going"}
            </Badge>
          </div>
        )}
        <Button className="w-full" onClick={onOpenRsvp}>
          {hasExistingRsvp ? "Change RSVP" : "RSVP Now"}
        </Button>
      </div>

      {/* Host row(s) */}
      {hostAttendees.map((host) => (
        <div key={host.contact_id} className="flex items-center gap-3">
          <div className="size-8 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {host.photo_thumbnail_url ? (
              <img src={host.photo_thumbnail_url} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{host.display_name}</p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Host
          </span>
        </div>
      ))}

      {/* Event meta */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Tent className="size-4 text-muted-foreground shrink-0" />
          <Badge variant="secondary">{EVENT_TYPE_LABELS[event.event_type]}</Badge>
        </div>

        {event.start_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <span>
              {formatDateOnly(event.start_date)}
              {event.end_date && ` – ${formatDateOnly(event.end_date)}`}
            </span>
          </div>
        )}

        {event.start_date && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-muted-foreground shrink-0" />
            <span>{formatTime(event.start_date)}</span>
          </div>
        )}

        {event.event_location && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-muted-foreground shrink-0" />
              <span className="truncate">{event.event_location}</span>
            </div>
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-6 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
              >
                Directions
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Static map */}
      {staticMapUrl && (
        <div className="overflow-hidden rounded-lg border border-border">
          <img
            src={staticMapUrl}
            alt={`Map of ${event.event_location}`}
            className="w-full"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function MemberEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = useMemberEventDetail(id!);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const createEventMutation = useCreateEvent();
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const handleDuplicate = async () => {
    if (!event) return;
    const newEvent = await createEventMutation.mutateAsync({
      name: `Copy of ${event.name}`,
      event_type: event.event_type,
      description: event.description ?? undefined,
      start_date: event.start_date ?? undefined,
      end_date: event.end_date ?? undefined,
      event_location: event.event_location ?? undefined,
      event_location_embed: event.event_location_embed ?? undefined,
      event_url: event.event_url ?? undefined,
      ga_ticket_cost: event.ga_ticket_cost ?? undefined,
      day_pass_cost: event.day_pass_cost ?? undefined,
      members_only: event.members_only,
      start_location: event.start_location ?? undefined,
      end_location: event.end_location ?? undefined,
      host_ids: event.host_ids.length > 0 ? event.host_ids : undefined,
    } as Record<string, unknown>);
    setDuplicateOpen(false);
    navigate(`/admin/events/${newEvent.id}`);
  };

  if (isLoading) return <DetailSkeleton />;

  if (error || !event) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Event not found.
        </div>
      </div>
    );
  }

  const hostContactIds = new Set(event.host_ids);
  const hosts = event.attendees.filter((a) => hostContactIds.has(a.contact_id));
  const nonHostAttendees = event.attendees.filter((a) => !hostContactIds.has(a.contact_id));

  const heroPhoto = event.photos[0];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Events
      </Link>

      {/* Duplicate confirmation dialog */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Duplicate event</DialogTitle>
            <DialogDescription>
              Create a copy of &ldquo;{event.name}&rdquo;? The new event will be named &ldquo;Copy
              of {event.name}&rdquo; and will open in the admin editor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={createEventMutation.isPending}>
              {createEventMutation.isPending ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eyebrow date */}
      {event.start_date && (
        <p className="text-sm text-muted-foreground">{formatDateLong(event.start_date)}</p>
      )}

      {/* Title + admin actions */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold">{event.name}</h1>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/events/${id}`}>
                <Pencil className="size-3.5" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDuplicateOpen(true)}>
              <Copy className="size-3.5" />
              Duplicate
            </Button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column */}
        <div className="flex-1 lg:basis-[65%] space-y-6 min-w-0">
          {/* Hero image */}
          {heroPhoto ? (
            <img
              src={heroPhoto.photo_display_url}
              alt=""
              className="w-full aspect-[16/7] object-cover rounded-lg"
            />
          ) : (
            <div className="w-full aspect-[16/7] rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="size-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Description */}
          {event.description && (
            <SafeHtml
              html={event.description}
              className="prose prose-sm max-w-none text-foreground [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline"
            />
          )}

          {/* Fee / CTA */}
          {(event.ga_ticket_cost != null || event.day_pass_cost != null) && (
            <div className="space-y-1">
              {event.ga_ticket_cost != null && (
                <p className="font-semibold">GA Ticket: ${event.ga_ticket_cost.toLocaleString()}</p>
              )}
              {event.day_pass_cost != null && (
                <p className="font-semibold">Day Pass: ${event.day_pass_cost.toLocaleString()}</p>
              )}
              {event.event_url && (
                <a
                  href={event.event_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-red-600 hover:underline font-medium"
                >
                  {event.event_url}
                </a>
              )}
            </div>
          )}

          {/* Schedule */}
          {event.schedule_items.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Schedule</h2>
              <div className="space-y-2">
                {event.schedule_items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 text-sm">
                    {item.scheduled_time && (
                      <span className="font-medium whitespace-nowrap text-muted-foreground shrink-0">
                        {formatTime(item.scheduled_time)}
                      </span>
                    )}
                    <div>
                      <p className="font-medium">{item.label}</p>
                      {item.location && <p className="text-muted-foreground">{item.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Attendees */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Attendees</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm">
                <Users className="size-3.5" />
                <span className="font-bold">{event.rsvp_yes_count}</span>
                <span className="text-muted-foreground">attendees</span>
              </span>
            </div>

            {/* Hosts */}
            {hosts.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Host{hosts.length > 1 ? "s" : ""}
                </p>
                <div className="divide-y divide-border">
                  {hosts.map((host) => (
                    <AttendeeCard key={host.contact_id} attendee={host} />
                  ))}
                </div>
              </div>
            )}

            {/* Attendees */}
            {nonHostAttendees.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Attendees
                </p>
                <div className="divide-y divide-border">
                  {nonHostAttendees.map((attendee) => (
                    <AttendeeCard key={attendee.contact_id} attendee={attendee} />
                  ))}
                </div>
              </div>
            )}

            {event.rsvp_yes_count === 0 && (
              <p className="text-sm text-muted-foreground">No one has RSVP'd yet.</p>
            )}
          </section>
        </div>

        {/* Right sidebar */}
        <div className="lg:basis-[35%] order-first lg:order-none lg:sticky lg:top-20 lg:self-start">
          <Sidebar event={event} onOpenRsvp={() => setRsvpOpen(true)} />
        </div>
      </div>

      {/* RSVP side sheet */}
      <RsvpSheet event={event} open={rsvpOpen} onOpenChange={setRsvpOpen} />
    </div>
  );
}
