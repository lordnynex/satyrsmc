import { Link, useNavigate, useParams } from "react-router-dom";
import { trpc } from "@/trpc";
import { UserStatus, UserType } from "@satyrsmc/shared/lib/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

const STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.Active]: "Active",
  [UserStatus.Locked]: "Locked",
  [UserStatus.Rejected]: "Rejected",
  [UserStatus.Suspended]: "Suspended",
  [UserStatus.Inactive]: "Inactive",
  [UserStatus.Deactivated]: "Deactivated",
};

const STATUS_COLORS: Record<UserStatus, string> = {
  [UserStatus.Active]: "bg-green-100 text-green-800",
  [UserStatus.Locked]: "bg-yellow-100 text-yellow-800",
  [UserStatus.Rejected]: "bg-red-100 text-red-800",
  [UserStatus.Suspended]: "bg-orange-100 text-orange-800",
  [UserStatus.Inactive]: "bg-gray-100 text-gray-600",
  [UserStatus.Deactivated]: "bg-gray-100 text-gray-400",
};

const TYPE_LABELS: Record<UserType, string> = {
  [UserType.User]: "User",
  [UserType.Admin]: "Admin",
  [UserType.Webmaster]: "Webmaster",
};

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: user, isLoading, error } = trpc.admin.users.get.useQuery({ id: id! });

  const updateStatus = trpc.admin.users.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.users.get.invalidate({ id: id! });
      utils.admin.users.list.invalidate();
    },
  });

  const updateType = trpc.admin.users.updateType.useMutation({
    onSuccess: () => {
      utils.admin.users.get.invalidate({ id: id! });
      utils.admin.users.list.invalidate();
    },
  });

  const linkMember = trpc.admin.users.linkMember.useMutation({
    onSuccess: () => {
      utils.admin.users.get.invalidate({ id: id! });
      utils.admin.users.list.invalidate();
    },
  });

  const addNote = trpc.admin.users.addNote.useMutation({
    onSuccess: () => {
      utils.admin.users.get.invalidate({ id: id! });
    },
  });

  const [noteText, setNoteText] = useState("");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading user...</p>;
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="size-4" />
          Back to Users
        </Button>
        <p className="text-sm text-destructive py-8 text-center">User not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Users
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.username}</h1>
          <p className="text-muted-foreground mt-1">
            {user.display_name || user.email || "No contact info"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[user.user_status]}`}
          >
            {STATUS_LABELS[user.user_status]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">{user.username}</span>

              <span className="text-muted-foreground">User Type</span>
              <span className="font-medium">{TYPE_LABELS[user.user_type]}</span>

              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{STATUS_LABELS[user.user_status]}</span>

              <span className="text-muted-foreground">Member</span>
              <span className="font-medium">
                {user.member_id ? (
                  <Link
                    to={`/admin/members/${user.member_id}`}
                    className="text-primary hover:underline"
                  >
                    View member profile
                  </Link>
                ) : (
                  "Not linked"
                )}
              </span>

              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </span>

              <span className="text-muted-foreground">Last Login</span>
              <span className="font-medium">
                {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
              </span>

              <span className="text-muted-foreground">Failed Logins</span>
              <span className="font-medium">{user.failed_login_attempts}</span>

              {user.locked_until && (
                <>
                  <span className="text-muted-foreground">Locked Until</span>
                  <span className="font-medium">
                    {new Date(user.locked_until).toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Change Status</label>
              <Select
                value={user.user_status}
                onValueChange={(val) =>
                  updateStatus.mutate({ id: user.id, user_status: val as UserStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {updateStatus.isPending && (
                <p className="text-xs text-muted-foreground">Updating...</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Change Role</label>
              <Select
                value={user.user_type}
                onValueChange={(val) =>
                  updateType.mutate({ id: user.id, user_type: val as UserType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {updateType.isPending && <p className="text-xs text-muted-foreground">Updating...</p>}
            </div>

            {!user.member_id && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Link Member</label>
                <p className="text-xs text-muted-foreground">
                  Associate this user with an existing member record. Enter the member ID.
                </p>
                <MemberLinkForm
                  userId={user.id}
                  onLink={(memberId) => linkMember.mutate({ id: user.id, member_id: memberId })}
                  isPending={linkMember.isPending}
                />
              </div>
            )}

            {user.member_id && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Linked Member</label>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/members/${user.member_id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View member profile
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => linkMember.mutate({ id: user.id, member_id: null })}
                    disabled={linkMember.isPending}
                  >
                    Unlink
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Admin Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.admin_note && (
              <div className="rounded-md bg-muted p-3 text-sm">{user.admin_note}</div>
            )}
            <Textarea
              placeholder="Add a note about this user..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              disabled={!noteText.trim() || addNote.isPending}
              onClick={() => {
                addNote.mutate(
                  { id: user.id, admin_note: noteText.trim() },
                  { onSuccess: () => setNoteText("") },
                );
              }}
            >
              {addNote.isPending ? "Saving..." : "Save Note"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemberLinkForm({
  userId: _userId,
  onLink,
  isPending,
}: {
  userId: string;
  onLink: (memberId: string) => void;
  isPending: boolean;
}) {
  const [memberId, setMemberId] = useState("");

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        placeholder="Member ID"
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
      />
      <Button
        size="sm"
        disabled={!memberId.trim() || isPending}
        onClick={() => onLink(memberId.trim())}
      >
        Link
      </Button>
    </div>
  );
}
