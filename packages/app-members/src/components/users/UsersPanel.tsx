import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/trpc";
import { UserStatus, UserType } from "@satyrsmc/shared/lib/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { InviteUserDialog } from "./InviteUserDialog";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, TYPE_LABELS } from "./userDisplay";

export function UsersPanel() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = trpc.admin.users.list.useQuery({
    status: statusFilter !== "all" ? (statusFilter as UserStatus) : undefined,
    user_type: typeFilter !== "all" ? (typeFilter as UserType) : undefined,
    q: debouncedSearch || undefined,
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, approvals, and invitations.
            {total > 0 && (
              <>
                {" "}
                {total} user{total === 1 ? "" : "s"} total.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="size-4" />
            Invite User
          </Button>
        </div>
      </div>

      <PendingAccountsBanner />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(UserStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.values(UserType).map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No users found matching your filters.
        </p>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => (
            <Card
              key={user.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/admin/users/${user.id}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.display_name || user.email || "No contact info"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {TYPE_LABELS[user.user_type]}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[user.user_status]}`}
                  >
                    {STATUS_LABELS[user.user_status]}
                  </span>
                  {user.member_id && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      Member
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RegistrationsSection />

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

function PendingAccountsBanner() {
  const { data } = trpc.admin.users.pendingCount.useQuery();
  if (!data) return null;
  const { locked_count, registration_count } = data;
  const total = locked_count + registration_count;
  if (total === 0) return null;

  const parts: string[] = [];
  if (locked_count > 0)
    parts.push(`${locked_count} locked account${locked_count === 1 ? "" : "s"}`);
  if (registration_count > 0)
    parts.push(`${registration_count} pending registration${registration_count === 1 ? "" : "s"}`);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
      <AlertTriangle className="size-5 shrink-0" />
      <span>
        <strong>
          {total} item{total === 1 ? "" : "s"} need{total === 1 ? "s" : ""} attention:
        </strong>{" "}
        {parts.join(" and ")}.
      </span>
    </div>
  );
}

function RegistrationsSection() {
  const { data: registrations, isLoading } = trpc.admin.users.listRegistrations.useQuery();

  if (isLoading || !registrations || registrations.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Pending Registrations</h2>
      <p className="text-sm text-muted-foreground">
        Users who have registered but not yet completed signup or been approved.
      </p>
      <div className="grid gap-3">
        {registrations.map((reg) => (
          <Card key={reg.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{reg.email}</p>
                <p className="text-sm text-muted-foreground">
                  {[reg.first_name, reg.last_name].filter(Boolean).join(" ") || "No name provided"}
                  {" — "}
                  Registered {reg.created_at ? new Date(reg.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {reg.contact_id && (
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                    Contact linked
                  </span>
                )}
                {reg.member_id && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    Member linked
                  </span>
                )}
                {reg.invited_by && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Invited
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
