import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMembersSuspense, useCreateCommittee, unwrapSuspenseData } from "@/queries/hooks";
import { MemberSelectCombobox } from "@/components/members/MemberSelectCombobox";
import { ArrowLeft, X } from "lucide-react";
import type { Member } from "@satyrsmc/shared/client";

export function CreateCommitteePage() {
  const createCommitteeMutation = useCreateCommittee();
  const navigate = useNavigate();
  const members = unwrapSuspenseData(useMembersSuspense()) ?? [];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [formedDate, setFormedDate] = useState(new Date().toISOString().slice(0, 10));
  const [chairpersonMemberId, setChairpersonMemberId] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const memberIdsSet = new Set(memberIds);

  const handleAddMember = (memberId: string) => {
    if (!memberIds.includes(memberId)) {
      setMemberIds((prev) => [...prev, memberId]);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setMemberIds((prev) => prev.filter((id) => id !== memberId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const committee = await createCommitteeMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        purpose: purpose.trim() || null,
        formed_date: formedDate,
        chairperson_member_id: chairpersonMemberId || null,
        member_ids: memberIds.length > 0 ? memberIds : undefined,
      });
      navigate(`/meetings/committees/${(committee as { id: string }).id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/meetings/committees">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Create committee</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Committee name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Optional purpose"
            />
          </div>
          <div className="space-y-2">
            <Label>Formation date</Label>
            <DatePicker value={formedDate} onChange={setFormedDate} placeholder="Pick date" />
          </div>
          <div className="space-y-2">
            <Label>Chairperson</Label>
            <Select
              value={chairpersonMemberId || "__none__"}
              onValueChange={(v) => setChairpersonMemberId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chairperson (optional)" />
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
          <div className="space-y-2">
            <Label>Initial members</Label>
            <MemberSelectCombobox
              members={members as Member[]}
              excludedIds={memberIdsSet}
              onSelect={handleAddMember}
              placeholder="Add a member..."
            />
            {memberIds.length > 0 && (
              <ul className="mt-2 space-y-1">
                {memberIds.map((mid) => {
                  const m = (members as Member[]).find((x) => x.id === mid);
                  return (
                    <li
                      key={mid}
                      className="flex items-center justify-between rounded border px-2 py-1 text-sm"
                    >
                      <span>{m?.name ?? mid}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMember(mid)}
                      >
                        <X className="size-3" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create committee"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/meetings/committees">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
