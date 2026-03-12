import { Suspense, useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { MailingList, Contact } from "@satyrsmc/shared/client";
import {
  useCreateMailingList,
  useDeleteMailingList,
  useUpdateMailingList,
  useMailingListRemoveMember,
  useMailingListReinstateMember,
  useInvalidateQueries,
  useMailingListsSuspense,
  useEventsSuspense,
  useMailingListSuspense,
  useMailingListPreview,
  useMailingListStats,
  useMailingListIncluded,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { contactsToVCardFileAsync } from "@/lib/vcard";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Download,
  Printer,
  Users,
  MapPin,
  Copy,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { AddContactToMailingListDialog } from "./AddContactToMailingListDialog";
import { ContactDirectoryTable } from "./ContactDirectoryTable";
import { CreateMailLabelsDialog } from "./CreateMailLabelsDialog";
import { PageLoading } from "@/components/layout/PageLoading";

export function MailingListsPanel() {
  const { listId } = useParams<{ listId?: string }>();
  const navigate = useNavigate();
  const createMailingListMutation = useCreateMailingList();
  const listsData = unwrapSuspenseData(useMailingListsSuspense());
  const lists = Array.isArray(listsData) ? listsData : [];
  const eventsData = unwrapSuspenseData(useEventsSuspense());
  const events: Array<{ id: string; name: string }> = Array.isArray(eventsData) ? eventsData : [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "1");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newListType, setNewListType] = useState<MailingList["list_type"]>("static");
  const [newDeliveryType, setNewDeliveryType] = useState<MailingList["delivery_type"]>("both");
  const [newEventId, setNewEventId] = useState<string>("");

  useEffect(() => {
    if (searchParams.get("create") === "1") setCreateOpen(true);
  }, [searchParams]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createMailingListMutation.mutateAsync({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      list_type: newListType,
      delivery_type: newDeliveryType,
      event_id: newEventId && newEventId !== "__none__" ? newEventId : null,
    });
    setNewName("");
    setNewDescription("");
    setNewListType("static");
    setNewDeliveryType("both");
    setNewEventId("");
    setCreateOpen(false);
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.delete("create");
      return next;
    });
  };

  if (listId) {
    return (
      <Suspense fallback={<PageLoading />}>
        <MailingListDetail
          listId={listId}
          events={events}
          onBack={() => navigate("/contacts/lists")}
        />
      </Suspense>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mailing Lists</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage mailing lists for physical invitations and email campaigns.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New list
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {lists.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No mailing lists yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {lists.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/contacts/lists/${l.id}`)}
                >
                  <div>
                    <p className="font-medium">{l.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {l.delivery_type ?? "both"} • {l.member_count ?? 0} members
                      {l.event_id && events.find((e) => e.id === l.event_id) && (
                        <> • {events.find((e) => e.id === l.event_id)!.name}</>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/contacts/lists/${l.id}`);
                    }}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open)
            setSearchParams((p) => {
              const n = new URLSearchParams(p);
              n.delete("create");
              return n;
            });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create mailing list</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Badger South 2026 Invitations"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Delivery type</Label>
              <Select
                value={newDeliveryType}
                onValueChange={(v) => setNewDeliveryType(v as MailingList["delivery_type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical mail only</SelectItem>
                  <SelectItem value="email">Email only</SelectItem>
                  <SelectItem value="both">Both (physical + email)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>List type</Label>
              <Select
                value={newListType}
                onValueChange={(v) => setNewListType(v as MailingList["list_type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static (manual members)</SelectItem>
                  <SelectItem value="dynamic">Dynamic (rules-based)</SelectItem>
                  <SelectItem value="hybrid">Hybrid (rules + manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Event (optional)</Label>
              <Select
                value={newEventId || "__none__"}
                onValueChange={(v) => setNewEventId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MailingListDetail({
  listId,
  events,
  onBack,
}: {
  listId: string;
  events: Array<{ id: string; name: string }>;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const invalidate = useInvalidateQueries();
  const deleteMailingListMutation = useDeleteMailingList();
  const updateMailingListMutation = useUpdateMailingList();
  const removeMemberMutation = useMailingListRemoveMember();
  const reinstateMemberMutation = useMailingListReinstateMember();
  const selectedList = unwrapSuspenseData(useMailingListSuspense(listId));
  const { data: preview } = useMailingListPreview(listId);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(selectedList?.name ?? "");
  const [editDescription, setEditDescription] = useState(selectedList?.description ?? "");
  const [editDeliveryType, setEditDeliveryType] = useState(selectedList?.delivery_type ?? "both");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [membersPage, setMembersPage] = useState(1);
  const [membersSearch, setMembersSearch] = useState("");
  const [membersSearchDebounced, setMembersSearchDebounced] = useState("");
  const membersLimit = 25;

  useEffect(() => {
    const t = setTimeout(() => setMembersSearchDebounced(membersSearch), 200);
    return () => clearTimeout(t);
  }, [membersSearch]);

  useEffect(() => {
    setMembersPage(1);
  }, [membersSearchDebounced]);

  const { data: stats } = useMailingListStats(listId);
  const { data: includedPage } = useMailingListIncluded(
    listId,
    membersPage,
    membersLimit,
    membersSearchDebounced || undefined,
  );

  if (!selectedList) return null;

  const refreshList = () => {
    invalidate.invalidateMailingList(listId);
  };

  const handleExportVCard = async () => {
    if (!preview || preview.included.length === 0) return;
    const contacts = preview.included.map((i) => i.contact as Contact);
    const vcf = await contactsToVCardFileAsync(contacts);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedList.name}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteList = async () => {
    if (!confirm("Delete this mailing list?")) return;
    await deleteMailingListMutation.mutateAsync(selectedList.id);
    onBack();
  };

  const handleSaveEdit = async () => {
    await updateMailingListMutation.mutateAsync({
      id: selectedList.id,
      body: { name: editName, description: editDescription, delivery_type: editDeliveryType },
    });
    setEditOpen(false);
    refreshList();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to Lists
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddMemberOpen(true)}>
            <Users className="size-4" />
            Add Contacts
          </Button>
          <Button
            variant="outline"
            onClick={handleExportVCard}
            disabled={!preview || preview.totalIncluded === 0}
          >
            <Download className="size-4" />
            Export vCard
          </Button>
          {((selectedList.delivery_type ?? "both") === "physical" ||
            (selectedList.delivery_type ?? "both") === "both") && (
            <Button
              onClick={() => setLabelsDialogOpen(true)}
              disabled={!preview || preview.totalIncluded === 0}
            >
              <Printer className="size-4" />
              Create Mail Labels
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setEditName(selectedList.name);
              setEditDescription(selectedList.description ?? "");
              setEditDeliveryType(selectedList.delivery_type ?? "both");
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteList}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{selectedList.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedList.delivery_type ?? "both"} • {selectedList.list_type} list
            {selectedList.event_id && events.find((e) => e.id === selectedList.event_id) && (
              <> • {events.find((e) => e.id === selectedList.event_id)!.name}</>
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedList.description && (
            <p className="text-muted-foreground">{selectedList.description}</p>
          )}

          <div>
            <h3 className="font-medium">Preview</h3>
            <p className="text-sm text-muted-foreground">
              {preview?.totalIncluded ?? 0} included, {preview?.totalExcluded ?? 0} excluded
            </p>
            {preview && preview.excluded.length > 0 && (
              <div className="mt-2 rounded-lg border p-3">
                <p className="text-sm font-medium">Excluded ({preview.excluded.length})</p>
                <ul className="mt-1 max-h-48 overflow-y-auto space-y-1 text-sm text-muted-foreground">
                  {preview.excluded.map((e) => {
                    const canRemoveFromList = e.canRemoveFromList === true;
                    const canReinstate = e.removable === true;
                    return (
                      <li key={e.contact.id} className="flex items-center justify-between gap-2">
                        <span>
                          {e.contact.display_name} – {e.reason}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {canReinstate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={async () => {
                                try {
                                  await reinstateMemberMutation.mutateAsync({
                                    listId: selectedList.id,
                                    contactId: e.contact.id,
                                  });
                                  refreshList();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                            >
                              Reinstate
                            </Button>
                          )}
                          {canRemoveFromList && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-destructive hover:text-destructive"
                              onClick={async () => {
                                try {
                                  await removeMemberMutation.mutateAsync({
                                    listId: selectedList.id,
                                    contactId: e.contact.id,
                                  });
                                  refreshList();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
          <p className="text-sm text-muted-foreground">
            Geographic distribution and duplicate address analysis
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {stats && (
            <>
              {((selectedList.delivery_type ?? "both") === "physical" ||
                (selectedList.delivery_type ?? "both") === "both") &&
                stats.geographic &&
                (stats.geographic.byState.length > 0 || stats.geographic.byCountry.length > 0) && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <MapPin className="size-4" />
                      Geographic distribution
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {stats.geographic.byState.length > 0 && (
                        <div className="rounded-lg border p-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">By state</p>
                          <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                            {stats.geographic.byState.map(({ state, count }) => (
                              <li key={state} className="flex justify-between">
                                <span>{state}</span>
                                <span className="text-muted-foreground">{count}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {stats.geographic.byCountry.length > 0 && (
                        <div className="rounded-lg border p-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            By country
                          </p>
                          <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                            {stats.geographic.byCountry.map(({ country, count }) => (
                              <li key={country} className="flex justify-between">
                                <span>{country}</span>
                                <span className="text-muted-foreground">{count}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              {stats.duplicateAddresses &&
                (() => {
                  const dupAddrs = stats.duplicateAddresses;
                  return (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Copy className="size-4" />
                        Duplicate addresses
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {dupAddrs.totalDuplicateContacts} contacts share an address with others
                        across {dupAddrs.uniqueAddressesWithDuplicates} unique addresses.
                      </p>
                      {dupAddrs.groups.length > 0 && (
                        <div className="rounded-lg border p-3 max-h-48 overflow-y-auto space-y-3">
                          {dupAddrs.groups.map((group) => (
                            <div key={group.address} className="text-sm">
                              <p
                                className="font-medium text-muted-foreground truncate"
                                title={group.address}
                              >
                                {group.address}
                              </p>
                              <ul className="mt-1 space-y-0.5 pl-2">
                                {group.contacts.map((c) => (
                                  <li key={c.id}>
                                    <button
                                      type="button"
                                      className="text-primary hover:underline"
                                      onClick={() => navigate(`/contacts/${c.id}`)}
                                    >
                                      {c.display_name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                      {dupAddrs.groups.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No duplicate addresses in this list.
                        </p>
                      )}
                    </div>
                  );
                })()}
            </>
          )}
          {!stats && <p className="text-sm text-muted-foreground">Loading stats…</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <p className="text-sm text-muted-foreground">
            People in this mailing list. Remove members with the delete icon when allowed.
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, organization, or email…"
              value={membersSearch}
              onChange={(e) => setMembersSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {includedPage ? (
            <>
              {includedPage.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  {membersSearchDebounced
                    ? "No members match your search."
                    : "No members in this list."}
                </p>
              ) : (
                <>
                  <ContactDirectoryTable
                    rows={includedPage.contacts.map(({ contact, canRemoveFromList }) => ({
                      contact: contact as Contact,
                      canRemoveFromList,
                    }))}
                    columns={["name", "phone", "address", "email", "actions"]}
                    onRowClick={(c) => navigate(`/contacts/${c.id}`)}
                    renderRowActions={({ contact, canRemoveFromList }) =>
                      canRemoveFromList ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm(`Remove ${contact.display_name} from this list?`)) return;
                            try {
                              await removeMemberMutation.mutateAsync({
                                listId: selectedList.id,
                                contactId: contact.id,
                              });
                              refreshList();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null
                    }
                  />
                  {includedPage.total > membersLimit && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {(membersPage - 1) * membersLimit + 1}–
                        {Math.min(membersPage * membersLimit, includedPage.total)} of{" "}
                        {includedPage.total}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={membersPage <= 1}
                          onClick={() => setMembersPage((p) => p - 1)}
                        >
                          <ChevronLeft className="size-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={membersPage * membersLimit >= includedPage.total}
                          onClick={() => setMembersPage((p) => p + 1)}
                        >
                          Next
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Loading members…</p>
          )}
        </CardContent>
      </Card>

      <AddContactToMailingListDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        listId={selectedList.id}
        onSuccess={refreshList}
      />

      <CreateMailLabelsDialog
        open={labelsDialogOpen}
        onOpenChange={setLabelsDialogOpen}
        listName={selectedList.name}
        contacts={(preview?.included ?? []).map((i) => i.contact as Contact)}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit mailing list</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div>
              <Label>Delivery type</Label>
              <Select value={editDeliveryType} onValueChange={(v) => setEditDeliveryType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical mail only</SelectItem>
                  <SelectItem value="email">Email only</SelectItem>
                  <SelectItem value="both">Both (physical + email)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
