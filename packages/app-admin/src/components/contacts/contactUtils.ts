import type { Contact, ContactAddress } from "@satyrsmc/shared/client";
import { jsPDF } from "jspdf";
import { formatPhoneNumber } from "@/lib/phone";

export function formatAddress(addr: ContactAddress | undefined): string {
  if (!addr) return "";
  const parts = [
    addr.address_line1,
    addr.address_line2,
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.postal_code,
    addr.country,
  ].filter(Boolean);
  return parts.join(" ");
}

export function getPrimaryAddress(contact: Contact): ContactAddress | undefined {
  const addrs = contact.addresses ?? [];
  return addrs.find((a) => a.is_primary_mailing) ?? addrs[0];
}

function escapeCsvValue(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/** Export contacts as CSV with common fields */
export function downloadContactsCsv(contacts: Contact[]): void {
  const headers = [
    "Name",
    "Organization",
    "Email",
    "Phone",
    "Address",
    "Tags",
    "Status",
  ];
  const rows = contacts.map((c) => {
    const primaryEmail = c.emails?.find((e) => e.is_primary) ?? c.emails?.[0];
    const primaryPhone = c.phones?.find((p) => p.is_primary) ?? c.phones?.[0];
    const addr = getPrimaryAddress(c);
    const addressStr = formatAddress(addr);
    const tagsStr = (c.tags ?? []).map((t) => t.name).join("; ");
    const phoneStr = formatPhoneNumber(primaryPhone?.phone ?? "");
    return [
      c.display_name,
      c.organization_name ?? "",
      primaryEmail?.email ?? "",
      phoneStr,
      addressStr,
      tagsStr,
      c.status,
    ].map(String).map(escapeCsvValue);
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "contacts.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Export contacts as a 2-column PDF */
export function downloadContactsPdf(contacts: Contact[]): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const gapX = 18;
  const colWidth = (pageWidth - margin * 2 - gapX) / 2;
  const lineHeight = 12;
  const cardPadding = 8;
  const cardGapY = 12;
  const fontSizeName = 11;
  const fontSizeDetail = 9;

  let col = 0;
  let rowY = margin;
  let maxY = margin;

  const sortedContacts = [...contacts].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );

  for (const c of sortedContacts) {
    if (col === 0 && rowY + 60 > pageHeight - margin) {
      doc.addPage();
      rowY = margin;
      maxY = margin;
    }

    const x = margin + col * (colWidth + gapX);
    const y = rowY;
    const contentWidth = colWidth - cardPadding * 2;
    const textStartX = x + cardPadding;
    let textY = y + cardPadding;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSizeName);
    const nameLines = doc.splitTextToSize(c.display_name, contentWidth);
    doc.text(nameLines, textStartX, textY);
    textY += nameLines.length * lineHeight;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSizeDetail);

    const details: string[] = [];
    if (c.organization_name) details.push(`Org: ${c.organization_name}`);
    const primaryEmail = c.emails?.find((e) => e.is_primary) ?? c.emails?.[0];
    if (primaryEmail?.email) details.push(`Email: ${primaryEmail.email}`);
    const primaryPhone = c.phones?.find((p) => p.is_primary) ?? c.phones?.[0];
    const phoneStr = formatPhoneNumber(primaryPhone?.phone ?? "");
    if (phoneStr) details.push(`Phone: ${phoneStr}`);
    const addr = getPrimaryAddress(c);
    const addressStr = formatAddress(addr);
    if (addressStr) details.push(`Address: ${addressStr}`);
    const tagsStr = (c.tags ?? []).map((t) => t.name).join(", ");
    if (tagsStr) details.push(`Tags: ${tagsStr}`);

    for (const line of details) {
      const wrapped = doc.splitTextToSize(line, contentWidth);
      for (const w of wrapped) {
        doc.text(w, textStartX, textY);
        textY += lineHeight;
      }
    }

    const cardBottom = textY + cardPadding;
    maxY = Math.max(maxY, cardBottom);

    col++;
    if (col >= 2) {
      col = 0;
      rowY = maxY + cardGapY;
    }
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "contacts.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
