import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Lock,
} from "lucide-react";
import { EventType, AttendeeStatus } from "@satyrsmc/shared/client";
import { formatDateOnly } from "@/lib/date-utils";
import type { MemberEventCard } from "@satyrsmc/shared/dto/member/event";
import { useMemberEventsList } from "@/queries/member-events";
import { EVENT_TYPE_LABELS } from "@/lib/event-constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const PER_PAGE = 18;

const EVENT_TYPE_BADGE_COLORS: Record<EventType, string> = {
  [EventType.Badger]: "bg-blue-600",
  [EventType.Anniversary]: "bg-amber-600",
  [EventType.PioneerRun]: "bg-emerald-600",
  [EventType.Rides]: "bg-purple-600",
};

const RSVP_BADGE_CONFIG: Record<
  string,
  { label: string; variant: "success" | "destructive" | "warning" }
> = {
  [AttendeeStatus.Yes]: { label: "Going", variant: "success" },
  [AttendeeStatus.No]: { label: "Not Going", variant: "destructive" },
  [AttendeeStatus.Pending]: { label: "Pending", variant: "warning" },
};

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function EventCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card aspect-[4/3]">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: MemberEventCard }) {
  const formattedDate = event.start_date ? formatDateOnly(event.start_date) : null;

  const rsvpConfig =
    event.my_rsvp && event.my_rsvp !== AttendeeStatus.NoResponse
      ? RSVP_BADGE_CONFIG[event.my_rsvp]
      : null;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card aspect-[4/3]">
      {/* Background image */}
      <img
        src={event.photo_url ?? "/images/event-placeholder.svg"}
        alt=""
        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 space-y-1.5">
        <h3 className="text-base font-semibold text-white leading-tight line-clamp-2">
          {event.name}
        </h3>

        {formattedDate && (
          <div className="flex items-center gap-1.5 text-sm text-white/80">
            <Calendar className="size-3.5 shrink-0" />
            <span>{formattedDate}</span>
          </div>
        )}

        {event.event_location && (
          <div className="flex items-center gap-1.5 text-sm text-white/70">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{event.event_location}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Badge
            className={`${EVENT_TYPE_BADGE_COLORS[event.event_type]} text-white border-transparent text-[11px]`}
          >
            {EVENT_TYPE_LABELS[event.event_type]}
          </Badge>

          <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Users className="size-3" />
            {event.rsvp_yes_count} Going
          </span>

          {event.members_only && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              <Lock className="size-3" />
              Members Only
            </span>
          )}

          {rsvpConfig && (
            <Badge variant={rsvpConfig.variant} className="text-[11px]">
              {rsvpConfig.label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function MemberEventsPage() {
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [upcoming, setUpcoming] = useState(true);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const input = {
    search: debouncedSearch || undefined,
    event_type: eventType !== "all" ? (eventType as EventType) : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    upcoming,
    page,
    per_page: PER_PAGE,
  };

  const { data, isLoading, error } = useMemberEventsList(input);

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 0;

  const hasActiveFilters =
    debouncedSearch !== "" || eventType !== "all" || dateFrom !== "" || dateTo !== "";

  function clearFilters() {
    setSearch("");
    setEventType("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  function handleFilterChange() {
    setPage(1);
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilterChange();
            }}
            className="pl-9"
          />
        </div>

        {/* Event type */}
        <Select
          value={eventType}
          onValueChange={(v) => {
            setEventType(v);
            handleFilterChange();
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(EventType).map((t) => (
              <SelectItem key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <DatePicker
          value={dateFrom}
          onChange={(v) => {
            setDateFrom(v);
            handleFilterChange();
          }}
          placeholder="From date"
          className="w-40"
        />
        <DatePicker
          value={dateTo}
          onChange={(v) => {
            setDateTo(v);
            handleFilterChange();
          }}
          placeholder="To date"
          className="w-40"
        />

        {/* Upcoming / Past toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="upcoming-toggle"
            checked={upcoming}
            onCheckedChange={(v) => {
              setUpcoming(v);
              setPage(1);
            }}
          />
          <Label htmlFor="upcoming-toggle" className="text-sm cursor-pointer">
            {upcoming ? "Upcoming" : "Past"}
          </Label>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load events. Please try again.
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <EventCardSkeleton key={`skeleton-${n}`} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="size-12 text-muted-foreground/50 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No events found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {hasActiveFilters
              ? "Try adjusting your filters."
              : upcoming
                ? "No upcoming events at this time."
                : "No past events found."}
          </p>
        </div>
      )}

      {/* Events grid */}
      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <EventCard event={event} />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
