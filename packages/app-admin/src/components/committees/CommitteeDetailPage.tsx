import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  useCommitteeSuspense,
  useMembersSuspense,
  useUpdateCommittee,
  useCommitteeAddMember,
  useCommitteeRemoveMember,
  useDeleteCommittee,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberCard } from "@/components/members/MemberCard";
import { MemberSelectCombobox } from "@/components/members/MemberSelectCombobox";
import { ArrowLeft, Pencil, X, Plus, Calendar, Trash2 } from "lucide-react";
import { formatDateOnly } from "@/lib/date-utils";
import type { Member } from "@satyrsmc/shared/client";

export function CommitteeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const committee = unwrapSuspenseData(useCommitteeSuspense(id!))!;
  const members = unwrapSuspenseData(useMembersSuspense()) ?? [];
  const updateCommitteeMutation = useUpdateCommittee();
  const addMemberMutation = useCommitteeAddMember();
  const removeMemberMutation = useCommitteeRemoveMember();
  const deleteCommitteeMutation = useDeleteCommittee();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const [name, setName] = useState(committee.name);
  const [description, setDescription] = useState(committee.description ?? "");
  const [purpose, setPurpose] = useState(committee.purpose ?? "");
  const [formedDate, setFormedDate] = useState(committee.formed_date);
  const [closedDate, setClosedDate] = useState(committee.closed_date ?? "");
  const [chairpersonMemberId, setChairpersonMemberId] = useState(
    committee.chairperson_member_id ?? "",
  );
  const [status, setStatus] = useState(committee.status);

  const memberIdsInCommittee = new Set(committee.members.map((m) => m.member_id));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCommitteeMutation.mutateAsync({
        id: id!,
        body: {
          name: name.trim(),
          description: description.trim() || null,
          purpose: purpose.trim() || null,
          formed_date: formedDate,
          closed_date: closedDate.trim() || null,
          chairperson_member_id: chairpersonMemberId || null,
          status,
        },
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(committee.name);
    setDescription(committee.description ?? "");
    setPurpose(committee.purpose ?? "");
    setFormedDate(committee.formed_date);
    setClosedDate(committee.closed_date ?? "");
    setChairpersonMemberId(committee.chairperson_member_id ?? "");
    setStatus(committee.status);
    setEditing(false);
  };

  const handleAddMember = async (memberId: string) => {
    await addMemberMutation.mutateAsync({ committeeId: id!, memberId });
    setAddMemberOpen(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMemberMutation.mutateAsync({ committeeId: id!, memberId });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCommitteeMutation.mutateAsync(id!);
      navigate("/meetings/committees");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-10 -mx-4 -mt-4 flex flex-col gap-4 border-b border-border/50 bg-background/95 px-4 py-4 md:-mx-6 md:-mt-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/meetings/committees">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            {editing ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Committee name"
                    className="h-9 w-48"
                  />
                  <DatePicker
                    value={formedDate}
                    onChange={setFormedDate}
                    placeholder="Formed date"
                    className="h-9"
                  />
                  <DatePicker
                    value={closedDate}
                    onChange={setClosedDate}
                    placeholder="Closed date (optional)"
                    className="h-9"
                  />
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={chairpersonMemberId || "__none__"}
                    onValueChange={(v) => setChairpersonMemberId(v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue placeholder="Chairperson" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {(members as Member[]).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X className="size-4" /> Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <h1 className="text-2xl font-semibold">{committee.name}</h1>
                <span className="text-muted-foreground">
                  Formed {formatDateOnly(committee.formed_date)}
                </span>
                {committee.closed_date && (
                  <span className="text-muted-foreground">
                    • Closed {formatDateOnly(committee.closed_date)}
                  </span>
                )}
                <span
                  className={
                    committee.status === "active"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  }
                >
                  {committee.status}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {committee.description && <p className="text-muted-foreground">{committee.description}</p>}
      {committee.purpose && (
        <p className="text-sm text-muted-foreground">
          <strong>Purpose:</strong> {committee.purpose}
        </p>
      )}
      {committee.chairperson_name && (
        <p className="text-sm text-muted-foreground">
          <strong>Chairperson:</strong> {committee.chairperson_name}
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Members</CardTitle>
          {committee.status === "active" && (
            <Button variant="outline" size="sm" onClick={() => setAddMemberOpen(true)}>
              <Plus className="size-4" />
              Add member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {(() => {
            const allMembersList = members as Member[];
            const memberIdsInList = new Set(committee.members.map((cm) => cm.member_id));
            const membersFromCommittee = committee.members
              .map((cm) => allMembersList.find((m) => m.id === cm.member_id))
              .filter((m): m is Member => m != null);
            const chairId = committee.chairperson_member_id;
            const chairInList = chairId && memberIdsInList.has(chairId);
            const chairMember =
              chairId && !chairInList ? allMembersList.find((m) => m.id === chairId) : null;
            const membersToShow: Member[] =
              chairMember != null
                ? [chairMember, ...membersFromCommittee.filter((m) => m.id !== chairId)]
                : membersFromCommittee;

            if (membersToShow.length === 0) {
              return <p className="text-sm text-muted-foreground">No members yet.</p>;
            }
            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {membersToShow.map((member) => (
                  <div key={member.id} className="relative group">
                    <MemberCard
                      member={member}
                      onNavigate={(memberId) => navigate(`/members/${memberId}`)}
                      isChair={member.id === committee.chairperson_member_id}
                    />
                    {committee.status === "active" && memberIdsInList.has(member.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(member.id);
                        }}
                        aria-label={`Remove ${member.name} from committee`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Meetings</CardTitle>
          {committee.status === "active" && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/meetings/committees/${id}/meetings/new`}>
                <Plus className="size-4" />
                New meeting
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {committee.meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Date</th>
                  <th className="py-2 text-left font-medium">#</th>
                  <th className="py-2 text-left font-medium">Location</th>
                  <th className="py-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {committee.meetings.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link
                        to={`/meetings/committees/${id}/meetings/${m.id}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Calendar className="size-4" />
                        {formatDateOnly(m.date)}
                      </Link>
                    </td>
                    <td className="py-2">{m.meeting_number}</td>
                    <td className="py-2 text-muted-foreground">{m.location ?? "—"}</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/meetings/committees/${id}/meetings/${m.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>Select a club member to add to this committee.</DialogDescription>
          </DialogHeader>
          <MemberSelectCombobox
            members={members as Member[]}
            excludedIds={memberIdsInCommittee}
            onSelect={handleAddMember}
            placeholder="Search members..."
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete committee?</DialogTitle>
            <DialogDescription>
              This will permanently delete the committee and all its meetings and documents. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete committee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
