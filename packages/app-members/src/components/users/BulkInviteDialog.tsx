import { useState, useEffect } from "react";
import { trpc } from "@/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Check, Users } from "lucide-react";

interface BulkInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkInviteDialog({ open, onOpenChange }: BulkInviteDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [result, setResult] = useState<{ count: number } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: contactListData } = trpc.admin.contacts.list.useQuery(
    { q: debouncedSearch || undefined },
    { enabled: open && debouncedSearch.length >= 2 },
  );

  const contacts = contactListData?.contacts ?? [];

  const generateMutation = trpc.admin.invitations.generateForAccountSetup.useMutation({
    onSuccess: (data) => {
      setResult({ count: data.length });
      setSelectedIds(new Set());
    },
  });

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(contacts.map((c) => c.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleGenerate = () => {
    if (selectedIds.size === 0) return;
    generateMutation.mutate({
      contactIds: [...selectedIds],
      expiresInDays: parseInt(expiresInDays) || 30,
    });
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSearch("");
      setDebouncedSearch("");
      setSelectedIds(new Set());
      setResult(null);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Bulk Account Setup Invitations
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-green-100 mb-3">
                <Check className="size-6 text-green-600" />
              </div>
              <p className="text-sm">
                <strong>{result.count}</strong> invitation{result.count !== 1 ? "s" : ""} generated.
                Each contact will receive an email with their setup link.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select contacts without accounts to send them account setup invitations.
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts without accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {contacts.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size} of {contacts.length} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={selectAll}>
                    Select All
                  </Button>
                  {selectedIds.size > 0 && (
                    <Button size="sm" variant="ghost" onClick={clearSelection}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-1 rounded border p-1">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contacts without accounts found.
                </p>
              ) : (
                contacts.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelected(c.id)}
                      className="rounded border-border"
                    />
                    <span className="text-sm font-medium truncate">{c.display_name}</span>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="bulk-expires" className="text-sm whitespace-nowrap">
                Expires in
              </Label>
              <Input
                id="bulk-expires"
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>

            {generateMutation.error && (
              <p className="text-sm text-destructive">{generateMutation.error.message}</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={selectedIds.size === 0 || generateMutation.isPending}
              >
                {generateMutation.isPending
                  ? "Generating..."
                  : `Send ${selectedIds.size} Invitation${selectedIds.size !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
