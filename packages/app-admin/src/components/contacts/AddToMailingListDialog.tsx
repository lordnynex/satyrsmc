import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMailingListsOptional, useMailingListAddMembersBulk } from "@/queries/hooks";

interface AddToMailingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactIds: string[];
  onSuccess: () => void;
}

export function AddToMailingListDialog({
  open,
  onOpenChange,
  contactIds,
  onSuccess,
}: AddToMailingListDialogProps) {
  const { data: lists = [] } = useMailingListsOptional();
  const addMembersBulkMutation = useMailingListAddMembersBulk();
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setSelectedListId("");
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedListId || contactIds.length === 0) return;
    setSaving(true);
    try {
      await addMembersBulkMutation.mutateAsync({
        listId: selectedListId,
        contactIds,
        source: "manual",
      });
      onOpenChange(false);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Mailing List</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Add {contactIds.length} contact{contactIds.length !== 1 ? "s" : ""} to a mailing list.
        </p>
        <div>
          <Select value={selectedListId} onValueChange={setSelectedListId}>
            <SelectTrigger>
              <SelectValue placeholder="Select list" />
            </SelectTrigger>
            <SelectContent>
              {lists.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedListId || saving}>
            {saving ? "Adding..." : "Add to List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
