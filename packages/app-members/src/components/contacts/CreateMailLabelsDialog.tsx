import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePdfLabels, AVERY_LAYOUTS, type LabelRecipient } from "@/lib/pdf-labels";
import type { Contact } from "@satyrsmc/shared/client";

interface CreateMailLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listName: string;
  contacts: Contact[];
}

function getPrimaryAddress(c: Contact): {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
} | null {
  const addrs = c.addresses ?? [];
  const primary = addrs.find((a) => a.is_primary_mailing) ?? addrs[0];
  if (!primary?.address_line1 && !primary?.city && !primary?.postal_code) return null;
  return {
    line1: primary.address_line1 ?? "",
    line2: primary.address_line2 ?? undefined,
    city: primary.city ?? "",
    state: primary.state ?? "",
    postalCode: primary.postal_code ?? "",
    country: primary.country ?? undefined,
  };
}

function contactToRecipient(c: Contact, includeOrg: boolean): LabelRecipient | null {
  const addr = getPrimaryAddress(c);
  if (!addr) return null;
  return {
    name: c.display_name,
    addressLine1: addr.line1,
    addressLine2: addr.line2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
    organization: includeOrg ? (c.organization_name ?? undefined) : undefined,
  };
}

export function CreateMailLabelsDialog({
  open,
  onOpenChange,
  listName,
  contacts,
}: CreateMailLabelsDialogProps) {
  const [layoutId, setLayoutId] = useState("avery5160");
  const [fontSize, setFontSize] = useState(10);
  const [includeOrganization, setIncludeOrganization] = useState(false);

  const layout = AVERY_LAYOUTS.find((l) => l.id === layoutId) ?? AVERY_LAYOUTS[0];
  const recipients = contacts
    .map((c) => contactToRecipient(c, includeOrganization))
    .filter((r): r is LabelRecipient => r !== null);

  const handleGenerate = () => {
    if (recipients.length === 0) return;
    const blob = generatePdfLabels(recipients, {
      layout,
      fontSize,
      includeOrganization,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listName}-labels.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Mail Labels</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {recipients.length} of {contacts.length} contacts have addresses and will be included.
          </p>

          <div>
            <Label>Label layout</Label>
            <Select value={layoutId} onValueChange={setLayoutId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVERY_LAYOUTS.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Font size</Label>
            <Select value={String(fontSize)} onValueChange={(v) => setFontSize(parseInt(v, 10))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8pt</SelectItem>
                <SelectItem value="9">9pt</SelectItem>
                <SelectItem value="10">10pt</SelectItem>
                <SelectItem value="11">11pt</SelectItem>
                <SelectItem value="12">12pt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeOrg"
              checked={includeOrganization}
              onChange={(e) => setIncludeOrganization(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="includeOrg" className="text-sm">
              Include organization
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={recipients.length === 0}>
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
