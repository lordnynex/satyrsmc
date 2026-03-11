import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ClipboardList, Plus, Trash2, UserPlus } from "lucide-react";
import { MemberChipPopover } from "@/components/members/MemberChipPopover";
import { MemberSelectCombobox } from "@/components/members/MemberSelectCombobox";
import { ALL_MEMBERS_ID } from "@satyrsmc/shared/lib/constants";
import { useMembersOptional } from "@/queries/hooks";
import type {
  Event,
  EventAssignment,
  EventAssignmentCategory,
  Member,
} from "@satyrsmc/shared/client";

const CATEGORY_LABELS: Record<EventAssignmentCategory, string> = {
  planning: "Event Planning",
  during: "During the Event",
};

interface EventAssignmentsCardProps {
  event: Event;
  onCreateRole: (payload: { name: string; category: EventAssignmentCategory }) => Promise<void>;
  onDeleteRole: (aid: string) => Promise<void>;
  onAddMember: (aid: string, memberId: string) => Promise<void>;
  onRemoveMember: (aid: string, memberId: string) => Promise<void>;
}

export function EventAssignmentsCard({
  event,
  onCreateRole,
  onDeleteRole,
  onAddMember,
  onRemoveMember,
}: EventAssignmentsCardProps) {
  const { data: members = [] } = useMembersOptional();
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleCategory, setRoleCategory] = useState<EventAssignmentCategory>("planning");

  const assignments = event.assignments ?? [];
  const planning = assignments
    .filter((a) => a.category === "planning")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const during = assignments
    .filter((a) => a.category === "during")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleCreateRole = async () => {
    if (!roleName.trim()) return;
    await onCreateRole({ name: roleName.trim(), category: roleCategory });
    setRoleName("");
    setRoleCategory("planning");
    setAddRoleOpen(false);
  };

  const openAddMember = (aid: string) => setAddMemberOpen(aid);
  const closeAddMember = () => setAddMemberOpen(null);

  const handleAddMember = async (aid: string, memberId: string) => {
    await onAddMember(aid, memberId);
    closeAddMember();
  };

  return (
    <>
      <Card id="assignments" className="scroll-mt-28">
        <Collapsible defaultOpen className="group/collapsible">
          <CardHeader>
            <CollapsibleTrigger className="flex w-full items-center justify-between text-left hover:bg-muted/50 -m-4 p-4 rounded-lg transition-colors">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="size-4" />
                  Assignments
                </CardTitle>
                <CardDescription>
                  Roles and responsibilities for planning and during the event
                </CardDescription>
              </div>
              <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <AssignmentColumn
                  title={CATEGORY_LABELS.planning}
                  roles={planning}
                  onDeleteRole={onDeleteRole}
                  onAddMember={openAddMember}
                  onRemoveMember={onRemoveMember}
                />
                <AssignmentColumn
                  title={CATEGORY_LABELS.during}
                  roles={during}
                  onDeleteRole={onDeleteRole}
                  onAddMember={openAddMember}
                  onRemoveMember={onRemoveMember}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setAddRoleOpen(true)}>
                <Plus className="size-4" />
                Add Role
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <CardDescription>Create a new assignment or role for this event</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Kitchen Menu, Kitchen, Registration"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={roleCategory}
                onValueChange={(v) => setRoleCategory(v as EventAssignmentCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">{CATEGORY_LABELS.planning}</SelectItem>
                  <SelectItem value="during">{CATEGORY_LABELS.during}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole}>Add Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addMemberOpen != null} onOpenChange={(o) => !o && closeAddMember()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <CardDescription>Assign a member to this role</CardDescription>
          </DialogHeader>
          <AddMemberForm
            members={members}
            assignmentId={addMemberOpen ?? ""}
            assignments={assignments}
            onAdd={handleAddMember}
            onClose={closeAddMember}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AssignmentColumnProps {
  title: string;
  roles: EventAssignment[];
  onDeleteRole: (aid: string) => void;
  onAddMember: (aid: string) => void;
  onRemoveMember: (aid: string, memberId: string) => void;
}

function AssignmentColumn({
  title,
  roles,
  onDeleteRole,
  onAddMember,
  onRemoveMember,
}: AssignmentColumnProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
      {roles.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4 border rounded-lg border-dashed text-center">
          No roles yet
        </p>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{role.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => onAddMember(role.id)}
                    aria-label="Add member"
                  >
                    <UserPlus className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDeleteRole(role.id)}
                    aria-label="Delete role"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(role.members ?? []).map((am) =>
                  am.member ? (
                    <MemberChipPopover
                      key={am.id}
                      memberId={am.member.id}
                      name={am.member.name}
                      photo={am.member.photo_thumbnail_url ?? am.member.photo_url}
                      onRemove={() => onRemoveMember(role.id, am.member_id)}
                      removeContextLabel="role"
                    />
                  ) : null,
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AddMemberFormProps {
  members: Member[];
  assignmentId: string;
  assignments: EventAssignment[];
  onAdd: (aid: string, memberId: string) => void;
  onClose: () => void;
}

function AddMemberForm({ members, assignmentId, assignments, onAdd, onClose }: AddMemberFormProps) {
  const assignment = assignments.find((a) => a.id === assignmentId);
  const assignedIds = new Set((assignment?.members ?? []).map((m) => m.member_id));

  return (
    <div className="space-y-4 py-4">
      <MemberSelectCombobox
        members={members}
        excludedIds={assignedIds}
        includeAllMembers={!assignedIds.has(ALL_MEMBERS_ID)}
        placeholder="Search or select a member to assign"
        label="Member"
        onSelect={(memberId) => {
          onAdd(assignmentId, memberId);
          onClose();
        }}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
