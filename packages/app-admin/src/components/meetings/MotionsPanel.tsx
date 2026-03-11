import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMotionsList } from "@/queries/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatDateOnly } from "@/lib/date-utils";
import type { MotionWithMeeting } from "@satyrsmc/shared/client";

const PER_PAGE = 25;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

function MotionRow({ m }: { m: MotionWithMeeting }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <Link
          to={`/meetings/${m.meeting_id}`}
          className="flex items-center gap-2 font-medium text-primary hover:underline"
        >
          <Calendar className="size-4 shrink-0" />
          {formatDateOnly(m.meeting_date)} (Meeting #{m.meeting_number})
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {m.description?.trim() ? m.description : "—"}
      </td>
      <td className="px-4 py-3">{m.mover_name ?? "—"}</td>
      <td className="px-4 py-3">{m.seconder_name ?? "—"}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            m.result === "pass"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {m.result === "pass" ? "Passed" : "Failed"}
        </span>
      </td>
    </tr>
  );
}

export function MotionsPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const qFromUrl = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(qFromUrl);
  const debouncedQ = useDebounce(searchInput, 300);

  useEffect(() => {
    setSearchInput(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    if (debouncedQ === qFromUrl) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedQ) next.set("q", debouncedQ);
    else next.delete("q");
    next.set("page", "1");
    setSearchParams(next, { replace: true });
  }, [debouncedQ, qFromUrl, searchParams, setSearchParams]);

  const { data, isPending, isError, error } = useMotionsList(page, PER_PAGE, qFromUrl || undefined);

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const end = Math.min(safePage * PER_PAGE, total);

  // Keep URL in sync when page is out of range (e.g. after total count drops)
  useEffect(() => {
    if (isPending || page === safePage) return;
    const next = new URLSearchParams(searchParams);
    next.set("page", String(safePage));
    setSearchParams(next, { replace: true });
  }, [isPending, page, safePage, searchParams, setSearchParams]);

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Motions</h1>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            {error?.message ?? "Failed to load motions."}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Motions</h1>
        <p className="text-muted-foreground mt-1">
          All motions from all meetings, ordered by meeting date (newest first).
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="sticky top-14 z-10 -mx-6 -mt-6 flex flex-col gap-4 border-b border-border/50 bg-card px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search motion text, mover, seconder, or meeting number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isPending ? (
            <div className="py-12 text-center text-muted-foreground">Loading motions…</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {qFromUrl ? "No motions match your search." : "No motions recorded in any meeting."}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Meeting</th>
                      <th className="px-4 py-3 text-left font-medium">Description</th>
                      <th className="px-4 py-3 text-left font-medium">Mover</th>
                      <th className="px-4 py-3 text-left font-medium">Seconder</th>
                      <th className="px-4 py-3 text-left font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((m) => (
                      <MotionRow key={m.id} m={m} />
                    ))}
                  </tbody>
                </table>
              </div>

              {total > PER_PAGE && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {start}–{end} of {total} (25 per page)
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Page {safePage} of {totalPages}
                    </span>
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
                        <ChevronLeft className="size-4" />
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
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
