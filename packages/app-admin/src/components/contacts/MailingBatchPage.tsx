import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MailingBatchRecipient } from "@satyrsmc/shared/client";
import { contactsToVCardFileAsync } from "@/lib/vcard";
import { formatDateTime } from "@/lib/date-utils";
import { generatePdfLabels } from "@/lib/pdf-labels";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  useMailingBatchSuspense,
  useUpdateMailingBatchRecipientStatus,
  unwrapSuspenseData,
} from "@/queries/hooks";

function recipientToContact(
  r: MailingBatchRecipient,
): Parameters<typeof contactsToVCardFileAsync>[0][number] {
  return {
    id: "",
    type: "person",
    status: "active",
    display_name: r.snapshot_name,
    first_name: null,
    last_name: null,
    organization_name: r.snapshot_organization,
    notes: null,
    how_we_know_them: null,
    ok_to_email: "unknown",
    ok_to_mail: "unknown",
    ok_to_sms: "unknown",
    do_not_contact: false,
    club_name: null,
    role: null,
    uid: null,
    emails: [],
    phones: [],
    addresses: [
      {
        id: "",
        contact_id: "",
        address_line1: r.snapshot_address_line1,
        address_line2: r.snapshot_address_line2,
        city: r.snapshot_city,
        state: r.snapshot_state,
        postal_code: r.snapshot_postal_code,
        country: r.snapshot_country,
        type: "home",
        is_primary_mailing: true,
      },
    ],
    tags: [],
  };
}

export function MailingBatchPage() {
  const { batchId } = useParams<{ batchId: string }>();
  if (!batchId) return null;
  return <MailingBatchContent batchId={batchId} />;
}

function MailingBatchContent({ batchId }: { batchId: string }) {
  const navigate = useNavigate();
  const updateStatusMutation = useUpdateMailingBatchRecipientStatus();
  const batch = unwrapSuspenseData(useMailingBatchSuspense(batchId));
  const [pdfFontSize, setPdfFontSize] = useState(10);
  const [pdfIncludeOrg, setPdfIncludeOrg] = useState(false);

  if (!batch) return null;

  const handleExportVCard = async () => {
    if (!batch?.recipients?.length) return;
    const contacts = batch.recipients.map(recipientToContact);
    const vcf = await contactsToVCardFileAsync(contacts);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.name}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!batch?.recipients?.length) return;
    const rows = batch.recipients.map((r) => [
      r.snapshot_name,
      r.snapshot_address_line1 ?? "",
      r.snapshot_address_line2 ?? "",
      r.snapshot_city ?? "",
      r.snapshot_state ?? "",
      r.snapshot_postal_code ?? "",
      r.snapshot_country ?? "US",
      r.snapshot_organization ?? "",
    ]);
    const header = "FullName,AddressLine1,AddressLine2,City,State,PostalCode,Country,Organization";
    const csv = [
      header,
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!batch?.recipients?.length) return;
    const recipients = batch.recipients.map((r) => ({
      name: r.snapshot_name,
      addressLine1: r.snapshot_address_line1 ?? "",
      addressLine2: r.snapshot_address_line2 ?? undefined,
      city: r.snapshot_city ?? "",
      state: r.snapshot_state ?? "",
      postalCode: r.snapshot_postal_code ?? "",
      country: r.snapshot_country ?? undefined,
      organization: pdfIncludeOrg ? (r.snapshot_organization ?? undefined) : undefined,
    }));
    const blob = generatePdfLabels(recipients, {
      fontSize: pdfFontSize,
      includeOrganization: pdfIncludeOrg,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.name}-labels.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = async (
    recipientId: string,
    status: MailingBatchRecipient["status"],
    reason?: string,
  ) => {
    await updateStatusMutation.mutateAsync({ batchId, recipientId, status, reason });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={() => navigate("/contacts/lists")}>
          <ArrowLeft className="size-4" />
          Back to Lists
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              Export
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportVCard}>vCard (.vcf)</DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCsv}>CSV (labels)</DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPdf}>PDF labels</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{batch.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {batch.recipient_count} recipients • Created {formatDateTime(batch.created_at)}
            {batch.list && ` • From ${batch.list.name}`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4 rounded-lg border p-3">
            <div>
              <p className="text-xs text-muted-foreground">PDF font size</p>
              <Select
                value={String(pdfFontSize)}
                onValueChange={(v) => setPdfFontSize(parseInt(v, 10))}
              >
                <SelectTrigger className="w-24">
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
                id="pdfOrg"
                checked={pdfIncludeOrg}
                onChange={(e) => setPdfIncludeOrg(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="pdfOrg" className="text-sm">
                Include organization in PDF
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-2 text-left font-medium">Name</th>
                  <th className="px-2 py-2 text-left font-medium">Address</th>
                  <th className="px-2 py-2 text-left font-medium">Status</th>
                  <th className="px-2 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(batch.recipients ?? []).map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-2 py-2">
                      <p className="font-medium">{r.snapshot_name}</p>
                      {r.snapshot_organization && (
                        <p className="text-xs text-muted-foreground">{r.snapshot_organization}</p>
                      )}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {[
                        r.snapshot_address_line1,
                        r.snapshot_address_line2,
                        r.snapshot_city,
                        r.snapshot_state,
                        r.snapshot_postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-xs ${
                          r.status === "mailed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : r.status === "returned" || r.status === "invalid"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-muted"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        value={r.status}
                        onValueChange={(v) =>
                          handleStatusChange(r.id, v as MailingBatchRecipient["status"])
                        }
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="queued">Queued</SelectItem>
                          <SelectItem value="printed">Printed</SelectItem>
                          <SelectItem value="mailed">Mailed</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                          <SelectItem value="invalid">Invalid</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
