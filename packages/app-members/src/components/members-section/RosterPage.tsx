import { useState } from "react";
import { Link } from "react-router-dom";
import { MemberPosition } from "@satyrsmc/shared/lib/enums";
import { trpc } from "@/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, List, Search, X, AlertCircle, Users, Shield, User } from "lucide-react";
import type { RosterMember, RosterListInput } from "@satyrsmc/shared/dto/member/roster";

type ViewMode = "card" | "list";

const VIEW_MODE_KEY = "satyrs_roster_view";

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    return stored === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}

export function RosterPage() {
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [search, setSearch] = useState("");
  const [yearJoined, setYearJoined] = useState<string>("");
  const [bikeMake, setBikeMake] = useState("");
  const [bikeModel, setBikeModel] = useState("");
  const [position, setPosition] = useState("");

  const input: RosterListInput = {};
  if (search.trim()) input.search = search.trim();
  if (yearJoined) input.year_joined = Number(yearJoined);
  if (bikeMake) input.bike_make = bikeMake;
  if (bikeModel) input.bike_model = bikeModel;
  const validPosition = Object.values(MemberPosition).find((p) => p === position);
  if (validPosition) input.position = validPosition;

  const hasFilters = !!(search || yearJoined || bikeMake || bikeModel || position);

  const { data, isLoading, error, refetch } = trpc.members.roster.list.useQuery(input, {
    staleTime: 30_000,
  });

  const { data: filterOptions } = trpc.members.roster.getFilterOptions.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  }

  function clearFilters() {
    setSearch("");
    setYearJoined("");
    setBikeMake("");
    setBikeModel("");
    setPosition("");
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Club Roster</h1>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="icon"
            onClick={() => handleViewModeChange("card")}
            aria-label="Card view"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => handleViewModeChange("list")}
            aria-label="List view"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      {data && <RosterSummary summary={data.summary} />}

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={yearJoined} onValueChange={setYearJoined}>
          <SelectTrigger>
            <SelectValue placeholder="Year Joined" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions?.years_joined.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={bikeMake} onValueChange={setBikeMake}>
          <SelectTrigger>
            <SelectValue placeholder="Bike Make" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions?.bike_makes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={bikeModel} onValueChange={setBikeModel}>
          <SelectTrigger>
            <SelectValue placeholder="Bike Model" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions?.bike_models.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger>
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(MemberPosition).map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="size-3" />
          Clear Filters
        </Button>
      )}

      {/* Content */}
      {isLoading ? (
        <RosterSkeleton viewMode={viewMode} />
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="size-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Failed to load roster</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : data && data.members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto size-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No members found.</p>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : data && viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.members.map((member) => (
            <RosterMemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : data ? (
        <RosterMemberTable members={data.members} />
      ) : null}
    </div>
  );
}

// ---- Summary ----

function RosterSummary({
  summary,
}: {
  summary: { total: number; officers: number; regular_members: number };
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-4 pb-3 flex items-center gap-3">
          <Shield className="size-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{summary.officers}</p>
            <p className="text-xs text-muted-foreground">Officers</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3 flex items-center gap-3">
          <User className="size-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{summary.regular_members}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3 flex items-center gap-3">
          <Users className="size-5 text-blue-500" />
          <div>
            <p className="text-2xl font-bold text-blue-500">{summary.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Card View ----

function RosterMemberCard({ member }: { member: RosterMember }) {
  const bikeLabel = member.bike
    ? [member.bike.year, member.bike.make, member.bike.model, member.bike.trim]
        .filter(Boolean)
        .join(" ")
    : null;
  const joinedYear = member.member_since ? new Date(member.member_since).getUTCFullYear() : null;

  return (
    <Link to={`/roster/${member.username}`} className="block group">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md h-full">
        {/* Bike photo background */}
        <div className="relative h-36 bg-muted">
          {member.bike?.has_photo ? (
            <img
              src={`/api/bikes/${member.bike.id}/photo?size=full`}
              alt={bikeLabel ?? "Bike"}
              className="w-full h-full object-cover brightness-[0.6]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
          )}
          {/* Avatar overlay */}
          <div className="absolute -bottom-8 left-4">
            {member.has_photo && member.photo_thumbnail_url ? (
              <img
                src={member.photo_thumbnail_url}
                alt={member.display_name}
                className="size-16 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="size-16 rounded-full border-4 border-background bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                {(member.first_name?.[0] ?? member.display_name[0]).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <CardContent className="pt-10 pb-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold truncate">{member.display_name}</h3>
            {member.position && member.position !== MemberPosition.Member && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {member.position}
              </Badge>
            )}
          </div>
          {bikeLabel && <p className="text-sm text-muted-foreground truncate">{bikeLabel}</p>}
          {joinedYear && <p className="text-xs text-muted-foreground">Joined {joinedYear}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

// ---- List View ----

type SortField = "default" | "name" | "position" | "joined" | "phone";

function compareNullLast(
  a: string | null | undefined,
  b: string | null | undefined,
  dir: 1 | -1,
): number {
  const aNull = a == null || a === "";
  const bNull = b == null || b === "";
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  return dir * a!.localeCompare(b!);
}

function RosterMemberTable({ members }: { members: RosterMember[] }) {
  const [sortField, setSortField] = useState<SortField>("default");
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  const sorted =
    sortField === "default"
      ? members
      : [...members].sort((a, b) => {
          const dir: 1 | -1 = sortAsc ? 1 : -1;
          switch (sortField) {
            case "name":
              return compareNullLast(a.last_name, b.last_name, dir);
            case "position":
              return compareNullLast(a.position, b.position, dir);
            case "joined":
              return compareNullLast(a.member_since, b.member_since, dir);
            case "phone":
              return compareNullLast(a.phone, b.phone, dir);
            default:
              return 0;
          }
        });

  const sortIndicator = (field: typeof sortField) =>
    sortField === field ? (sortAsc ? " \u25B2" : " \u25BC") : "";

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th
              className="px-4 py-3 text-left font-medium cursor-pointer select-none"
              onClick={() => handleSort("name")}
            >
              Member{sortIndicator("name")}
            </th>
            <th
              className="px-4 py-3 text-left font-medium cursor-pointer select-none hidden sm:table-cell"
              onClick={() => handleSort("position")}
            >
              Position{sortIndicator("position")}
            </th>
            <th
              className="px-4 py-3 text-left font-medium cursor-pointer select-none hidden sm:table-cell"
              onClick={() => handleSort("joined")}
            >
              Joined{sortIndicator("joined")}
            </th>
            <th
              className="px-4 py-3 text-left font-medium cursor-pointer select-none hidden md:table-cell"
              onClick={() => handleSort("phone")}
            >
              Phone{sortIndicator("phone")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((member) => {
            const joinedYear = member.member_since
              ? new Date(member.member_since).getUTCFullYear()
              : null;

            return (
              <tr key={member.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    to={`/roster/${member.username}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    {member.has_photo && member.photo_thumbnail_url ? (
                      <img
                        src={member.photo_thumbnail_url}
                        alt=""
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {(member.first_name?.[0] ?? member.display_name[0]).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{member.display_name}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  {member.position && member.position !== MemberPosition.Member
                    ? member.position
                    : ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  {joinedYear ?? ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {member.phone ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---- Skeleton ----

function RosterSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24 hidden sm:block" />
            <Skeleton className="h-4 w-16 hidden sm:block" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-36 w-full" />
          <CardContent className="pt-10 pb-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
