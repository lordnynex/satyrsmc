import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseVCardFile, parsedToContactPayload, type ParsedVCardContact } from "@/lib/vcard";
import {
  useContactsImportPstPreview,
  useContactsImportPstExecute,
  useCreateContact,
} from "@/queries/hooks";
import type { Contact } from "@satyrsmc/shared/client";
import { Upload, FileText, Mail } from "lucide-react";

interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ImportMode = "vcard" | "csv" | "pst" | null;

interface PstPreviewItem {
  payload: Partial<Contact> & { display_name: string };
  status: "new" | "duplicate";
  existingContact?: { id: string; display_name: string };
}

export function ImportContactsDialog({ open, onOpenChange, onSuccess }: ImportContactsDialogProps) {
  const importPstPreviewMutation = useContactsImportPstPreview();
  const importPstExecuteMutation = useContactsImportPstExecute();
  const createContactMutation = useCreateContact();
  const [mode, setMode] = useState<ImportMode>(null);
  const [parsed, setParsed] = useState<ParsedVCardContact[]>([]);
  const [pstPreview, setPstPreview] = useState<PstPreviewItem[]>([]);
  const [pstSelected, setPstSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext === "vcf" || ext === "vcard") {
        setMode("vcard");
        setPstPreview([]);
        setPstSelected(new Set());
        try {
          const text = await file.text();
          const contacts = parseVCardFile(text);
          setParsed(contacts);
          if (contacts.length === 0) setError("No valid contacts found in file.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to parse vCard");
          setParsed([]);
        }
      } else if (ext === "pst") {
        setMode("pst");
        setParsed([]);
        setLoading(true);
        try {
          const { contacts } = await importPstPreviewMutation.mutateAsync(file);
          setPstPreview(contacts);
          const newIndices = new Set(
            contacts
              .map((c, i) => (c.status === "new" ? i : -1))
              .filter((i) => i >= 0)
          );
          setPstSelected(newIndices);
          if (contacts.length === 0) setError("No contacts found in PST file.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to parse PST file");
          setPstPreview([]);
          setPstSelected(new Set());
        } finally {
          setLoading(false);
        }
      } else if (ext === "csv") {
        setMode("csv");
        setParsed([]);
        setPstPreview([]);
        setError("CSV import: parse file and map columns. For now, use vCard (.vcf) or PST (.pst) for import.");
      } else {
        setError("Please select a .vcf, .vcard, .pst, or .csv file.");
      }
      e.target.value = "";
    },
    [importPstPreviewMutation]
  );

  const togglePstSelected = (index: number) => {
    setPstSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAllPst = (includeDuplicates: boolean) => {
    if (includeDuplicates) {
      setPstSelected(new Set(pstPreview.map((_, i) => i)));
    } else {
      setPstSelected(
        new Set(pstPreview.map((c, i) => (c.status === "new" ? i : -1)).filter((i) => i >= 0))
      );
    }
  };

  const handleImport = async () => {
    if (mode === "pst") {
      const toCreate = pstPreview
        .filter((_, i) => pstSelected.has(i))
        .map((c) => c.payload);
      if (toCreate.length === 0) return;
      setImporting(true);
      try {
        await importPstExecuteMutation.mutateAsync(toCreate);
        onOpenChange(false);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed");
      } finally {
        setImporting(false);
      }
    } else {
      if (parsed.length === 0) return;
      setImporting(true);
      try {
        for (const p of parsed) {
          const payload = parsedToContactPayload(p);
          await createContactMutation.mutateAsync(
            payload as Parameters<typeof createContactMutation.mutateAsync>[0]
          );
        }
        onOpenChange(false);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed");
      } finally {
        setImporting(false);
      }
    }
  };

  const handleClose = () => {
    setMode(null);
    setParsed([]);
    setPstPreview([]);
    setPstSelected(new Set());
    setError(null);
    onOpenChange(false);
  };

  const importCount =
    mode === "pst" ? pstSelected.size : parsed.length;
  const canImport = mode === "pst" ? pstSelected.size > 0 : parsed.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Import from vCard (.vcf), Outlook PST (.pst), or CSV. PST import deduplicates by email and
          name.
        </p>

        <div className="space-y-4">
          <div>
            <Label>Select file</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 hover:bg-muted">
                <Upload className="size-4" />
                <span>Choose vCard (.vcf)</span>
                <input type="file" accept=".vcf,.vcard" onChange={handleFile} className="hidden" />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 hover:bg-muted">
                <Mail className="size-4" />
                <span>Choose PST (.pst)</span>
                <input type="file" accept=".pst" onChange={handleFile} className="hidden" />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 hover:bg-muted">
                <FileText className="size-4" />
                <span>Choose CSV</span>
                <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
              </label>
            </div>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Parsing PST file…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {mode === "vcard" && parsed.length > 0 && (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                {parsed.length} contact{parsed.length !== 1 ? "s" : ""} ready to import
              </p>
              <ul className="mt-2 max-h-40 overflow-y-auto text-sm text-muted-foreground">
                {parsed.slice(0, 10).map((p, i) => (
                  <li key={i}>{p.fn || p.org || "Unknown"}</li>
                ))}
                {parsed.length > 10 && <li>... and {parsed.length - 10} more</li>}
              </ul>
            </div>
          )}

          {mode === "pst" && pstPreview.length > 0 && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {pstPreview.length} contact{pstPreview.length !== 1 ? "s" : ""} found
                  {pstPreview.some((c) => c.status === "duplicate") && (
                    <span className="ml-2 text-muted-foreground">
                      ({pstPreview.filter((c) => c.status === "new").length} new,{" "}
                      {pstPreview.filter((c) => c.status === "duplicate").length} duplicates)
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAllPst(false)}
                  >
                    Select new only
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAllPst(true)}
                  >
                    Select all
                  </Button>
                </div>
              </div>
              <ul className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {pstPreview.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/50 text-sm"
                  >
                    <input
                      type="checkbox"
                      id={`pst-${i}`}
                      checked={pstSelected.has(i)}
                      onChange={() => togglePstSelected(i)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <label
                      htmlFor={`pst-${i}`}
                      className="flex-1 cursor-pointer truncate"
                    >
                      {c.payload.display_name || "Unknown"}
                      {c.status === "duplicate" && c.existingContact && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (duplicate of {c.existingContact.display_name})
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!canImport || importing}>
            {importing
              ? "Importing..."
              : `Import ${importCount} contact${importCount !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
