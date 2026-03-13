import { useState } from "react";
import { Link } from "react-router-dom";
import { useCommitteesSuspense, unwrapSuspenseData } from "@/queries/hooks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatDateOnly } from "@/lib/date-utils";
import { CommitteeStatus } from "@satyrsmc/shared/client";
import type { CommitteeSummary } from "@satyrsmc/shared/client";

function CommitteeRow({ c }: { c: CommitteeSummary }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <Link
          to={`/admin/meetings/committees/${c.id}`}
          className="font-medium text-primary hover:underline"
        >
          {c.name}
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {formatDateOnly(c.formed_date?.toString() ?? "")}
      </td>
      <td className="px-4 py-3">
        <span
          className={
            c.status === "active"
              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
          }
        >
          {c.status}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{c.member_count}</td>
      <td className="px-4 py-3 text-muted-foreground">{c.meeting_count}</td>
      <td className="px-4 py-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/admin/meetings/committees/${c.id}`}>View</Link>
        </Button>
      </td>
    </tr>
  );
}

export function CommitteesPanel() {
  const committees = unwrapSuspenseData(useCommitteesSuspense()) ?? [];
  const [filter, setFilter] = useState<"all" | CommitteeStatus>("all");

  const filtered = filter === "all" ? committees : committees.filter((c) => c.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Committees</h1>
        <Button asChild>
          <Link to="/admin/meetings/committees/new">
            <Plus className="size-4" />
            New committee
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === CommitteeStatus.Active ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter(CommitteeStatus.Active)}
        >
          Active
        </Button>
        <Button
          variant={filter === CommitteeStatus.Closed ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter(CommitteeStatus.Closed)}
        >
          Closed
        </Button>
      </div>

      <section>
        <div className="rounded-md border">
          {filtered.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Formation date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Members</th>
                  <th className="px-4 py-3 text-left font-medium">Meetings</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <CommitteeRow key={c.id} c={c} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-12 text-center text-muted-foreground">
              {committees.length === 0
                ? "No committees yet. Create one to get started."
                : `No ${filter} committees.`}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
