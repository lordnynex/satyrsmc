import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateMailingList,
  useMailingListAddAllHellenics,
  useInvalidateQueries,
  useContactsSuspense,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { contactsToVCardFileAsync } from "@/lib/vcard";
import { Plus, Search, Download, List } from "lucide-react";
import { AddContactDialog } from "./AddContactDialog";
import { AddToMailingListDialog } from "./AddToMailingListDialog";
import { ContactDirectoryTable } from "./ContactDirectoryTable";
import type { ContactSearchParams } from "@satyrsmc/shared/client";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export function HellenicsPanel() {
  const navigate = useNavigate();
  const invalidate = useInvalidateQueries();
  const createMailingListMutation = useCreateMailingList();
  const addAllHellenicsMutation = useMailingListAddAllHellenics();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const params: ContactSearchParams = {
    q: debouncedSearch || undefined,
    status: "active",
    hellenic: true,
    sort: "name",
    sortDir: "asc",
    page,
    limit: 25,
  };

  const result = unwrapSuspenseData(useContactsSuspense(params));
  const contacts = result?.contacts ?? [];
  const total = result?.total ?? 0;

  const refresh = () => invalidate.invalidateContacts();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const handleExportVCard = async () => {
    const toExport = selectedIds.size ? contacts.filter((c) => selectedIds.has(c.id)) : contacts;
    if (toExport.length === 0) return;
    const vcf = await contactsToVCardFileAsync(toExport);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hellenics.vcf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateListFromHellenics = async () => {
    const name = newListName.trim() || "Hellenics";
    setCreating(true);
    try {
      const list = await createMailingListMutation.mutateAsync({
        name,
        description: "Contact list created from Hellenics directory",
        list_type: "static",
        delivery_type: "both",
      });
      await addAllHellenicsMutation.mutateAsync((list as { id: string }).id);
      setCreateListOpen(false);
      setNewListName("");
      navigate(`/contacts/lists/${(list as { id: string }).id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hellenics</h1>
          <p className="mt-1 text-muted-foreground">
            A directory of the club&apos;s Hellenics. Mark contacts as Hellenic in their profile to
            include them here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCreateListOpen(true)}>
            <List className="size-4" />
            Create list from Hellenics
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search Hellenics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button variant="outline" size="sm" onClick={handleExportVCard}>
                <Download className="size-4" />
                Export vCard
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAddToListOpen(true)}>
                <List className="size-4" />
                Add to list
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          )}

          {contacts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No Hellenics found. Mark contacts as Hellenic in their profile to include them here.
            </div>
          ) : (
            <div className="mt-4">
              <ContactDirectoryTable
                rows={contacts.map((c) => ({ contact: c }))}
                columns={["checkbox", "name", "phone", "address", "email"]}
                selectable
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onRowClick={(c) => navigate(`/contacts/${c.id}`)}
              />
            </div>
          )}

          {total > 25 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 25 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddContactDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={refresh}
        defaultHellenic
      />
      <AddToMailingListDialog
        open={addToListOpen}
        onOpenChange={setAddToListOpen}
        contactIds={[...selectedIds]}
        onSuccess={() => {
          setSelectedIds(new Set());
          refresh();
        }}
      />

      <Dialog open={createListOpen} onOpenChange={setCreateListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create list from Hellenics</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Create a new mailing list and add all Hellenics to it. Deceased contacts are excluded.
          </p>
          <Input
            placeholder="List name (e.g. Hellenics 2026)"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateListOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateListFromHellenics} disabled={creating}>
              {creating ? "Creating..." : "Create list"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
