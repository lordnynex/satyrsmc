import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  useMembersOptional,
  useMotionCreate,
  useMotionUpdate,
  useMotionDelete,
} from "@/queries/hooks";
import { MemberChip } from "@/components/members/MemberChip";
import type { MeetingMotion, MotionResult } from "@satyrsmc/shared/client";

interface MotionsCardProps {
  meetingId: string;
  motions: MeetingMotion[];
}

export function MotionsCard({ meetingId, motions }: MotionsCardProps) {
  const { data: members = [] } = useMembersOptional();
  const createMutation = useMotionCreate();
  const updateMutation = useMotionUpdate();
  const deleteMutation = useMotionDelete();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [moverMemberId, setMoverMemberId] = useState("");
  const [seconderMemberId, setSeconderMemberId] = useState("");
  const [result, setResult] = useState<MotionResult>("pass");

  const handleAdd = async () => {
    if (!moverMemberId || !seconderMemberId) return;
    if (moverMemberId === seconderMemberId) return; // Robert's Rules: seconded by another member
    await createMutation.mutateAsync({
      meetingId,
      body: {
        description: description.trim() || null,
        result,
        mover_member_id: moverMemberId,
        seconder_member_id: seconderMemberId,
      },
    });
    setDescription("");
    setMoverMemberId("");
    setSeconderMemberId("");
    setResult("pass");
    setAdding(false);
  };

  const handleUpdate = async (mid: string) => {
    if (!moverMemberId || !seconderMemberId) return;
    if (moverMemberId === seconderMemberId) return;
    await updateMutation.mutateAsync({
      meetingId,
      motionId: mid,
      body: {
        description: description.trim() || null,
        result,
        mover_member_id: moverMemberId,
        seconder_member_id: seconderMemberId,
      },
    });
    setEditingId(null);
    setDescription("");
    setMoverMemberId("");
    setSeconderMemberId("");
  };

  const handleDelete = async (mid: string) => {
    await deleteMutation.mutateAsync({ meetingId, motionId: mid });
  };

  const startEdit = (m: MeetingMotion) => {
    setEditingId(m.id);
    setDescription(m.description ?? "");
    setMoverMemberId(m.mover_member_id ?? "");
    setSeconderMemberId(m.seconder_member_id ?? "");
    setResult(m.result ?? "pass");
  };

  const resetForm = () => {
    setAdding(false);
    setEditingId(null);
    setDescription("");
    setMoverMemberId("");
    setSeconderMemberId("");
    setResult("pass");
  };

  const getMember = (id: string | null | undefined) =>
    id ? (members.find((x) => x.id === id) ?? null) : null;
  const moverName = (id: string | null | undefined) =>
    id ? (members.find((x) => x.id === id)?.name ?? id) : "—";
  const canSaveAdd = moverMemberId && seconderMemberId && moverMemberId !== seconderMemberId;
  const canSaveEdit =
    editingId && moverMemberId && seconderMemberId && moverMemberId !== seconderMemberId;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Motions</CardTitle>
        {!adding ? (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={moverMemberId} onValueChange={setMoverMemberId}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Moved by" />
              </SelectTrigger>
              <SelectContent>
                {members.map((mem) => (
                  <SelectItem key={mem.id} value={mem.id}>
                    {mem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={seconderMemberId} onValueChange={setSeconderMemberId}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Seconded by" />
              </SelectTrigger>
              <SelectContent>
                {members.map((mem) => (
                  <SelectItem key={mem.id} value={mem.id} disabled={mem.id === moverMemberId}>
                    {mem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-w-[160px] flex-1"
            />
            <Select value={result} onValueChange={(v) => setResult(v as MotionResult)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass">Passed</SelectItem>
                <SelectItem value="fail">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={!canSaveAdd}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {motions.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-2 rounded-md border p-3">
              {editingId === m.id ? (
                <div className="flex flex-1 flex-wrap gap-2">
                  <Select value={moverMemberId} onValueChange={setMoverMemberId}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Moved by" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((mem) => (
                        <SelectItem key={mem.id} value={mem.id}>
                          {mem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={seconderMemberId} onValueChange={setSeconderMemberId}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Seconded by" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((mem) => (
                        <SelectItem key={mem.id} value={mem.id} disabled={mem.id === moverMemberId}>
                          {mem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-w-[160px] flex-1"
                  />
                  <Select value={result} onValueChange={(v) => setResult(v as MotionResult)}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Passed</SelectItem>
                      <SelectItem value="fail">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => handleUpdate(m.id)} disabled={!canSaveEdit}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-1">
                      <span>Moved by</span>
                      {(() => {
                        const mover = getMember(m.mover_member_id);
                        return mover ? (
                          <MemberChip
                            memberId={mover.id}
                            name={mover.name}
                            photo={mover.photo_thumbnail_url ?? null}
                          />
                        ) : (
                          <span>{m.mover_name ?? moverName(m.mover_member_id)}</span>
                        );
                      })()}
                      <span>, seconded by</span>
                      {(() => {
                        const seconder = getMember(m.seconder_member_id);
                        return seconder ? (
                          <MemberChip
                            memberId={seconder.id}
                            name={seconder.name}
                            photo={seconder.photo_thumbnail_url ?? null}
                          />
                        ) : (
                          <span>{m.seconder_name ?? moverName(m.seconder_member_id)}</span>
                        );
                      })()}
                    </p>
                    {m.description != null && m.description.trim() !== "" && (
                      <p className="mt-1 text-sm">{m.description}</p>
                    )}
                    <span
                      className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        m.result === "pass"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {m.result === "pass" ? "Motion passed" : "Motion failed"}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(m)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(m.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        {motions.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">No motions recorded.</p>
        )}
      </CardContent>
    </Card>
  );
}
