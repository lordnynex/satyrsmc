import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMeetingsSuspense, unwrapSuspenseData } from "@/queries/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, Search, ArrowDownNarrowWide, ArrowUpNarrowWide } from "lucide-react";
import { formatDateOnly } from "@/lib/date-utils";
import type { MeetingSummary } from "@satyrsmc/shared/client";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

function MeetingRow({ m }: { m: MeetingSummary }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <Link
          to={`/admin/meetings/${m.id}`}
          className="flex items-center gap-2 font-medium text-primary hover:underline"
        >
          <Calendar className="size-4" />
          {formatDateOnly(m.date)}
        </Link>
      </td>
      <td className="px-4 py-3">{m.meeting_number}</td>
      <td className="px-4 py-3 text-muted-foreground">{m.location ?? "—"}</td>
      <td className="px-4 py-3">
        <Link to={`/admin/meetings/${m.id}/agenda/edit`} className="text-primary hover:underline">
          Agenda
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link to={`/admin/meetings/${m.id}/minutes/edit`} className="text-primary hover:underline">
          Minutes
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{m.motion_count ?? 0}</td>
    </tr>
  );
}

function MeetingsTable({ meetings }: { meetings: MeetingSummary[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted/50">
          <th className="px-4 py-3 text-left font-medium">Date</th>
          <th className="px-4 py-3 text-left font-medium">#</th>
          <th className="px-4 py-3 text-left font-medium">Location</th>
          <th className="px-4 py-3 text-left font-medium">Agenda</th>
          <th className="px-4 py-3 text-left font-medium">Minutes</th>
          <th className="px-4 py-3 text-left font-medium">Motions</th>
        </tr>
      </thead>
      <tbody>
        {meetings.map((m) => (
          <MeetingRow key={m.id} m={m} />
        ))}
      </tbody>
    </table>
  );
}

export function MeetingsPanel() {
  const meetings = unwrapSuspenseData(useMeetingsSuspense()) ?? [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const debouncedSearch = useDebounce(search, 300);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = 25;

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = [...meetings]
    .filter((m) => m.date >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = [...meetings]
    .filter((m) => m.date < today)
    .filter((m) => {
      if (!debouncedSearch.trim()) return true;
      const q = debouncedSearch.toLowerCase();
      const loc = (m.location ?? "").toLowerCase();
      const num = String(m.meeting_number);
      return loc.includes(q) || num.includes(q);
    })
    .sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });

  const totalPast = past.length;
  const totalPages = Math.max(1, Math.ceil(totalPast / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedPast = past.slice((safePage - 1) * perPage, safePage * perPage);

  // Reset to page 1 when search or sort changes (not on initial mount)
  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", "1");
      return next;
    });
  }, [debouncedSearch, sortOrder]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Meetings</h1>
        <Button asChild>
          <Link to="/admin/meetings/new">
            <Plus className="size-4" />
            New meeting
          </Link>
        </Button>
      </div>

      {/* Upcoming meetings */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Upcoming meetings</h2>
        <div className="rounded-md border">
          {upcoming.length > 0 ? (
            <MeetingsTable meetings={upcoming} />
          ) : (
            <div className="px-4 py-12 text-center text-muted-foreground">
              No upcoming meetings.
            </div>
          )}
        </div>
      </section>

      {/* Past meetings */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Past meetings</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="sticky top-14 z-10 -mx-6 -mt-6 flex flex-col gap-4 border-b border-border/50 bg-card px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by location or meeting #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1 rounded-md border p-0.5">
                <Button
                  variant={sortOrder === "newest" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSortOrder("newest")}
                >
                  <ArrowDownNarrowWide className="size-4" />
                  Newest first
                </Button>
                <Button
                  variant={sortOrder === "oldest" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSortOrder("oldest")}
                >
                  <ArrowUpNarrowWide className="size-4" />
                  Oldest first
                </Button>
              </div>
            </div>

            {past.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {meetings.length === 0
                  ? "No meetings yet. Create one to get started."
                  : debouncedSearch.trim()
                    ? "No past meetings match your search."
                    : "No past meetings."}
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-md border">
                  <MeetingsTable meetings={paginatedPast} />
                </div>

                {totalPast > perPage && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(safePage - 1) * perPage + 1}–
                      {Math.min(safePage * perPage, totalPast)} of {totalPast}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage <= 1}
                        onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.set("page", String(safePage - 1));
                          setSearchParams(next);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage >= totalPages}
                        onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.set("page", String(safePage + 1));
                          setSearchParams(next);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
