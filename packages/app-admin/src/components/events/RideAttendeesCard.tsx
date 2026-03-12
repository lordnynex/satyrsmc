import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, FileCheck, Users } from "lucide-react";
import { useMembersOptional, useContactsListFetcher } from "@/queries/hooks";
import { MemberChipPopover } from "@/components/members/MemberChipPopover";
import { ContactStatusFilter } from "@satyrsmc/shared/client";
import type { EventAttendee, RideMemberAttendee, Contact, Member } from "@satyrsmc/shared/client";

interface RideAttendeesCardProps {
  eventId: string;
  attendees: EventAttendee[];
  memberAttendees: RideMemberAttendee[];
  onAdd: (contactId: string, waiverSigned?: boolean) => Promise<void>;
  onUpdateWaiver: (attendeeId: string, waiverSigned: boolean) => Promise<void>;
  onRemove: (attendeeId: string) => Promise<void>;
  onAddMember: (memberId: string, waiverSigned?: boolean) => Promise<void>;
  onUpdateMemberWaiver: (attendeeId: string, waiverSigned: boolean) => Promise<void>;
  onRemoveMember: (attendeeId: string) => Promise<void>;
}

export function RideAttendeesCard({
  eventId: _eventId,
  attendees,
  memberAttendees,
  onAdd,
  onUpdateWaiver,
  onRemove,
  onAddMember,
  onUpdateMemberWaiver,
  onRemoveMember,
}: RideAttendeesCardProps) {
  const fetchContactsList = useContactsListFetcher();
  const { data: members = [] } = useMembersOptional();
  const [addOpen, setAddOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [waiverChecked, setWaiverChecked] = useState(false);
  const [memberWaiverChecked, setMemberWaiverChecked] = useState(false);

  const existingIds = new Set(attendees.map((a) => a.contact_id));
  const existingMemberIds = new Set(memberAttendees.map((a) => a.member_id));

  useEffect(() => {
    if (!addOpen) return;
    const t = setTimeout(() => {
      setLoading(true);
      fetchContactsList({
        q: search || undefined,
        status: ContactStatusFilter.Active,
        excludeDeceased: true,
        limit: 50,
      })
        .then((r) => setContacts(r.contacts))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [addOpen, search, fetchContactsList]);

  const availableContacts = contacts.filter((c) => !existingIds.has(c.id));
  const availableMembers = (members as Member[]).filter((m) => !existingMemberIds.has(m.id));

  const handleAdd = async (closeAfter = false) => {
    if (!selectedId) return;
    await onAdd(selectedId, waiverChecked);
    setSelectedId(null);
    setWaiverChecked(false);
    if (closeAfter) setAddOpen(false);
  };

  const handleAddMember = async (closeAfter = false) => {
    if (!selectedMemberId) return;
    await onAddMember(selectedMemberId, memberWaiverChecked);
    setSelectedMemberId(null);
    setMemberWaiverChecked(false);
    if (closeAfter) setAddMemberOpen(false);
  };

  return (
    <Card id="ride-attendees">
      <CardHeader>
        <div>
          <CardTitle>Attendees</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Contacts and club members who attended. Toggle waiver status.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contacts section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground">Contacts</h4>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="size-4 mr-1" />
              Add contact
            </Button>
          </div>
          {attendees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1">No contacts added yet.</p>
          ) : (
            <ul className="space-y-1">
              {attendees.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50"
                >
                  <span className="flex-1 min-w-0 truncate text-sm font-medium">
                    {a.contact?.display_name ?? a.contact_id}
                  </span>
                  <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={a.waiver_signed}
                      onChange={(e) => onUpdateWaiver(a.id, e.target.checked)}
                      className="rounded size-3.5"
                    />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileCheck className="size-3" />
                      Waiver
                    </span>
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive shrink-0"
                    onClick={() => confirm("Remove attendee?") && onRemove(a.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Club members section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="size-4" />
              Club members
            </h4>
            <Button size="sm" variant="outline" onClick={() => setAddMemberOpen(true)}>
              <Plus className="size-4 mr-1" />
              Add member
            </Button>
          </div>
          {memberAttendees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1">No club members added yet.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2 py-1">
              {memberAttendees.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5">
                  <MemberChipPopover
                    memberId={a.member_id}
                    name={a.member?.name ?? a.member_id}
                    photo={a.member?.photo_thumbnail_url ?? null}
                    onRemove={() => confirm("Remove member?") && onRemoveMember(a.id)}
                    removeContextLabel="attendees"
                  />
                  <label
                    className="flex items-center gap-1 cursor-pointer shrink-0"
                    title="Waiver signed"
                  >
                    <input
                      type="checkbox"
                      checked={a.waiver_signed}
                      onChange={(e) => onUpdateMemberWaiver(a.id, e.target.checked)}
                      className="rounded size-3"
                    />
                    <FileCheck className="size-3 text-muted-foreground" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-md">
          <DialogHeader>
            <DialogTitle>Add attendee</DialogTitle>
            <DialogDescription className="sr-only">
              Search contacts and add them as attendees. Use Add more to add multiple, or Add &
              close when done.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Searching...</p>
            ) : availableContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts found.</p>
            ) : (
              availableContacts.slice(0, 20).map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 rounded p-2 cursor-pointer ${
                    selectedId === c.id ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <input
                    type="radio"
                    name="contact"
                    checked={selectedId === c.id}
                    onChange={() => setSelectedId(c.id)}
                  />
                  <span className="flex-1 truncate">{c.display_name}</span>
                </div>
              ))
            )}
          </div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={waiverChecked}
              onChange={(e) => setWaiverChecked(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Waiver signed</span>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Done
            </Button>
            <Button variant="outline" onClick={() => handleAdd(false)} disabled={!selectedId}>
              Add more
            </Button>
            <Button onClick={() => handleAdd(true)} disabled={!selectedId}>
              Add & close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-h-[90vh] max-w-md">
          <DialogHeader>
            <DialogTitle>Add club member</DialogTitle>
            <DialogDescription className="sr-only">
              Select a club member who attended. Use Add more to add multiple, or Add & close when
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
            {availableMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No members available (all already added).
              </p>
            ) : (
              availableMembers.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-2 rounded p-2 cursor-pointer ${
                    selectedMemberId === m.id ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedMemberId(m.id)}
                >
                  <input
                    type="radio"
                    name="member"
                    checked={selectedMemberId === m.id}
                    onChange={() => setSelectedMemberId(m.id)}
                  />
                  <span className="flex-1 truncate">{m.name}</span>
                </div>
              ))
            )}
          </div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={memberWaiverChecked}
              onChange={(e) => setMemberWaiverChecked(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Waiver signed</span>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              Done
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddMember(false)}
              disabled={!selectedMemberId}
            >
              Add more
            </Button>
            <Button onClick={() => handleAddMember(true)} disabled={!selectedMemberId}>
              Add & close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
