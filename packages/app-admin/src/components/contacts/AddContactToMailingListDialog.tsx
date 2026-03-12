import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useMailingListMembers,
  useContactsOptional,
  useMailingListAddMembersBulk,
  useMailingListAddAllContacts,
  useMailingListAddAllHellenics,
} from "@/queries/hooks";
import { ContactStatusFilter } from "@satyrsmc/shared/client";

interface AddContactToMailingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  onSuccess: () => void;
}

export function AddContactToMailingListDialog({
  open,
  onOpenChange,
  listId,
  onSuccess,
}: AddContactToMailingListDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [open, search]);

  const { data: members = [] } = useMailingListMembers(open ? listId : null);
  const existingMemberIds = new Set(members.map((m) => m.contact_id));

  const { data: contactsResult, isLoading: loading } = useContactsOptional(
    {
      q: debouncedSearch || undefined,
      status: ContactStatusFilter.Active,
      excludeDeceased: true,
      limit: 50,
    },
    { enabled: open },
  );
  const contacts = contactsResult?.contacts ?? [];

  const addMembersBulkMutation = useMailingListAddMembersBulk();
  const addAllContactsMutation = useMailingListAddAllContacts();
  const addAllHellenicsMutation = useMailingListAddAllHellenics();

  const toggleSelect = (id: string) => {
    if (existingMemberIds.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      await addMembersBulkMutation.mutateAsync({
        listId,
        contactIds: [...selectedIds],
        source: "manual",
      });
      setSelectedIds(new Set());
      onOpenChange(false);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  const handleAddAllContacts = async () => {
    setSaving(true);
    try {
      await addAllContactsMutation.mutateAsync(listId);
      onOpenChange(false);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  const handleAddAllHellenics = async () => {
    setSaving(true);
    try {
      await addAllHellenicsMutation.mutateAsync(listId);
      onOpenChange(false);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  const availableContacts = contacts.filter((c) => !existingMemberIds.has(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contacts</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleAddAllContacts} disabled={saving}>
            {saving ? "Adding..." : "Add ALL contacts"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddAllHellenics} disabled={saving}>
            {saving ? "Adding..." : "Add all Hellenics"}
          </Button>
        </div>
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        <div className="max-h-64 overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Searching...</p>
          ) : availableContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts found.</p>
          ) : (
            availableContacts.slice(0, 30).map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-2 rounded p-2 cursor-pointer ${
                  selectedIds.has(c.id) ? "bg-primary/10" : "hover:bg-muted"
                }`}
                onClick={() => toggleSelect(c.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="rounded"
                />
                <span className="flex-1 truncate">{c.display_name}</span>
                {c.emails?.[0] && (
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {c.emails[0].email}
                  </span>
                )}
              </div>
            ))
          )}
          {availableContacts.length > 30 && (
            <p className="text-sm text-muted-foreground">
              Showing first 30. Refine search for more.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={selectedIds.size === 0 || saving}>
            {saving
              ? "Adding..."
              : `Add ${selectedIds.size} contact${selectedIds.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
