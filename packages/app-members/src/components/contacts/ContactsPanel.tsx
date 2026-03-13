import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactStatusFilter, SortDirection } from "@satyrsmc/shared/client";
import type { ContactSearchParams } from "@satyrsmc/shared/client";
import { contactsToVCardFileAsync } from "@/lib/vcard";
import { Link } from "react-router-dom";
import { Plus, Search, Download, Upload, List, Trash2 } from "lucide-react";
import { AddContactDialog } from "./AddContactDialog";
import { ImportContactsDialog } from "./ImportContactsDialog";
import { AddToMailingListDialog } from "./AddToMailingListDialog";
import { ContactsExportDropdown } from "./ContactsExportDropdown";
import { downloadContactsCsv, downloadContactsPdf } from "./contactUtils";
import { ContactDirectoryTable } from "./ContactDirectoryTable";
import {
  useContactsSuspense,
  useInvalidateQueries,
  useContactsBulkUpdate,
  useDeleteContact,
  useContactsListFetcher,
  unwrapSuspenseData,
} from "@/queries/hooks";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export function ContactsPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const invalidate = useInvalidateQueries();
  const bulkUpdateMutation = useContactsBulkUpdate();
  const deleteContactMutation = useDeleteContact();
  const fetchContactsList = useContactsListFetcher();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContactSearchParams["status"]>(ContactStatusFilter.Active);
  const [hasPostal, setHasPostal] = useState<boolean | undefined>();
  const [hasEmail, setHasEmail] = useState<boolean | undefined>();
  const [sort, setSort] = useState<ContactSearchParams["sort"]>("updated_at");
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.Desc);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const params: ContactSearchParams = {
    q: debouncedSearch || undefined,
    status,
    hasPostalAddress: hasPostal,
    hasEmail,
    sort,
    sortDir,
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

  const handleBulkExportVCard = async () => {
    const toExport = selectedIds.size ? contacts.filter((c) => selectedIds.has(c.id)) : contacts;
    if (toExport.length === 0) return;
    const vcf = await contactsToVCardFileAsync(toExport);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.vcf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkMarkInactive = async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdateMutation.mutateAsync({
      ids: [...selectedIds],
      updates: { status: "inactive" },
    });
    setSelectedIds(new Set());
    refresh();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Delete ${selectedIds.size} contact${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`,
      )
    )
      return;
    for (const id of selectedIds) {
      await deleteContactMutation.mutateAsync(id);
    }
    setSelectedIds(new Set());
    refresh();
  };

  const fetchAllContacts = async (): Promise<typeof contacts> => {
    const baseParams: ContactSearchParams = {
      q: params.q,
      status: params.status,
      hasPostalAddress: params.hasPostalAddress,
      hasEmail: params.hasEmail,
      sort: params.sort,
      sortDir: params.sortDir,
      limit: 100,
    };
    const all: typeof contacts = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const result = await fetchContactsList({ ...baseParams, page });
      all.push(...result.contacts);
      hasMore = result.contacts.length === 100 && all.length < result.total;
      page++;
    }
    return all;
  };

  const handleExportCsv = async () => {
    const allContacts = await fetchAllContacts();
    downloadContactsCsv(allContacts);
  };

  const handleExportPdf = async () => {
    const allContacts = await fetchAllContacts();
    downloadContactsPdf(allContacts);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Unified directory for people and organizations. Manage mailing lists for events.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ContactsExportDropdown onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" />
            Import
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/contacts/lists">Mailing Lists</Link>
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="sticky top-14 z-10 -mx-6 -mt-6 flex flex-col gap-4 border-b border-border/50 bg-card px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone, city, tags, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={status ?? "active"}
              onValueChange={(v) => setStatus(v as ContactSearchParams["status"])}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={hasPostal === undefined ? "any" : hasPostal ? "yes" : "no"}
              onValueChange={(v) => setHasPostal(v === "any" ? undefined : v === "yes")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Address" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any address</SelectItem>
                <SelectItem value="yes">Has postal</SelectItem>
                <SelectItem value="no">No postal</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={hasEmail === undefined ? "any" : hasEmail ? "yes" : "no"}
              onValueChange={(v) => setHasEmail(v === "any" ? undefined : v === "yes")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Email" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any email</SelectItem>
                <SelectItem value="yes">Has email</SelectItem>
                <SelectItem value="no">No email</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sort}-${sortDir}`}
              onValueChange={(v) => {
                const [s, d] = v.split("-");
                setSort(s as ContactSearchParams["sort"]);
                setSortDir((d as SortDirection) ?? SortDirection.Desc);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="updated_at-desc">Last updated</SelectItem>
                <SelectItem value="updated_at-asc">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button variant="outline" size="sm" onClick={handleBulkExportVCard}>
                <Download className="size-4" />
                Export vCard
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAddToListOpen(true)}>
                <List className="size-4" />
                Add to list
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkMarkInactive}>
                Mark inactive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          )}

          {contacts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No contacts found. Add one or import from vCard/CSV.
            </div>
          ) : (
            <div className="mt-4">
              <ContactDirectoryTable
                rows={contacts.map((c) => ({ contact: c }))}
                columns={["checkbox", "name", "phone", "address", "email", "tags", "status"]}
                selectable
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onRowClick={(c) =>
                  navigate(`/admin/contacts/${c.id}`, {
                    state: { from: location.pathname + location.search },
                  })
                }
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
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("page", String(page - 1));
                    setSearchParams(next);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 25 >= total}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("page", String(page + 1));
                    setSearchParams(next);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddContactDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={refresh} />
      <ImportContactsDialog open={importOpen} onOpenChange={setImportOpen} onSuccess={refresh} />
      <AddToMailingListDialog
        open={addToListOpen}
        onOpenChange={setAddToListOpen}
        contactIds={[...selectedIds]}
        onSuccess={() => {
          setSelectedIds(new Set());
          refresh();
        }}
      />
    </div>
  );
}
