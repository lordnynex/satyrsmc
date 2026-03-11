import type { Contact, ContactEmail, ContactAddress } from "@satyrsmc/shared/client";

export function escapeVCardValue(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Convert a Contact to vCard 4.0 format */
export function contactToVCard4(c: Contact, options?: { includeNotes?: boolean; includePhone?: boolean; includeEmail?: boolean }): string {
  const opts = { includeNotes: true, includePhone: true, includeEmail: true, ...options };
  const lines: string[] = ["BEGIN:VCARD", "VERSION:4.0"];

  const uid = c.uid ?? `contact-${c.id}@satyrsmc`;
  lines.push(`UID:${uid}`);
  lines.push(`REV:${(c.updated_at ?? c.created_at ?? new Date().toISOString()).replace(/[-:]/g, "").slice(0, 15)}Z`);

  const fn = c.display_name?.trim() || "Unknown";
  lines.push(`FN:${escapeVCardValue(fn)}`);

  if (c.type === "person") {
    const family = c.last_name ?? "";
    const given = c.first_name ?? "";
    const additional = "";
    const prefix = "";
    const suffix = "";
    lines.push(`N:${escapeVCardValue(family)};${escapeVCardValue(given)};${escapeVCardValue(additional)};${escapeVCardValue(prefix)};${escapeVCardValue(suffix)}`);
  }

  if (c.organization_name) {
    lines.push(`ORG:${escapeVCardValue(c.organization_name)}`);
  }
  if (c.role) {
    lines.push(`TITLE:${escapeVCardValue(c.role)}`);
  }

  if (opts.includeEmail && c.emails?.length) {
    for (const e of c.emails) {
      const type = e.type && e.type !== "other" ? `;TYPE=${e.type.toUpperCase()}` : "";
      const pref = e.is_primary ? ";PREF=1" : "";
      lines.push(`EMAIL${type}${pref}:${e.email}`);
    }
  }

  if (opts.includePhone && c.phones?.length) {
    for (const p of c.phones) {
      const type = p.type && p.type !== "other" ? `;TYPE=${p.type.toUpperCase()}` : "";
      const pref = p.is_primary ? ";PREF=1" : "";
      lines.push(`TEL${type}${pref}:${p.phone.replace(/\s/g, "")}`);
    }
  }

  if (c.addresses?.length) {
    for (const a of c.addresses) {
      const type = a.type && a.type !== "home" ? `;TYPE=${a.type.toUpperCase()}` : ";TYPE=HOME";
      const pref = a.is_primary_mailing ? ";PREF=1" : "";
      const adr = [
        a.address_line2 ?? "",
        a.address_line1 ?? "",
        "",
        a.city ?? "",
        a.state ?? "",
        a.postal_code ?? "",
        a.country ?? "US",
      ].map(escapeVCardValue).join(";");
      lines.push(`ADR${type}${pref}:${adr}`);
    }
  }

  const notesText = (c.contact_notes?.length
    ? c.contact_notes.map((n) => n.content).join("\n\n")
    : c.notes) ?? "";
  if (opts.includeNotes && notesText) {
    lines.push(`NOTE:${escapeVCardValue(notesText.slice(0, 2000))}`);
  }

  if (c.tags?.length) {
    lines.push(`CATEGORIES:${c.tags.map((t) => escapeVCardValue(t.name)).join(",")}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

/** Fold a long vCard line per RFC 6350 (max 75 octets, continuation lines start with space) */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  while (remaining.length > 0) {
    if (parts.length === 0) {
      parts.push(remaining.slice(0, 75));
      remaining = remaining.slice(75);
    } else {
      parts.push("\r\n " + remaining.slice(0, 74));
      remaining = remaining.slice(74);
    }
  }
  return parts.join("");
}

/** Convert a Contact to vCard 4.0 format, including main profile photo if present (async) */
export async function contactToVCard4Async(
  c: Contact,
  options?: { includeNotes?: boolean; includePhone?: boolean; includeEmail?: boolean }
): Promise<string> {
  const vcf = contactToVCard4(c, options);
  const mainPhoto = c.contact_photos?.find((p) => p.type === "profile") ?? c.contact_photos?.[0];
  if (!mainPhoto?.photo_url) return vcf;

  try {
    const res = await fetch(mainPhoto.photo_url);
    if (!res.ok) return vcf;
    const blob = await res.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        resolve(base64 ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    if (!base64) return vcf;

    const mediaType = blob.type?.startsWith("image/") ? blob.type : "image/jpeg";
    const photoLine = `PHOTO;MEDIATYPE=${mediaType}:${base64}`;
    const folded = foldLine(photoLine);
    return vcf.replace("END:VCARD", `${folded}\r\nEND:VCARD`);
  } catch {
    return vcf;
  }
}

/** Export multiple contacts as a single vCard file (concatenated), including photos (async) */
export async function contactsToVCardFileAsync(
  contacts: Contact[],
  options?: { includeNotes?: boolean }
): Promise<string> {
  const vcfs = await Promise.all(contacts.map((c) => contactToVCard4Async(c, options)));
  return vcfs.join("\r\n");
}

/** Export multiple contacts as a single vCard file (concatenated) */
export function contactsToVCardFile(contacts: Contact[], options?: { includeNotes?: boolean }): string {
  return contacts.map((c) => contactToVCard4(c, options)).join("\r\n");
}

/** Parse vCard 3.0 or 4.0 from string - returns array of parsed contact-like objects */
export interface ParsedVCardContact {
  uid?: string;
  fn?: string;
  n?: { family?: string; given?: string; additional?: string; prefix?: string; suffix?: string };
  org?: string;
  title?: string;
  emails: Array<{ value: string; type?: string; pref?: number }>;
  tels: Array<{ value: string; type?: string; pref?: number }>;
  adrs: Array<{
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    type?: string;
    pref?: number;
  }>;
  note?: string;
  categories?: string[];
}

function unescapeVCardValue(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function splitVCardBlocks(text: string): string[] {
  const unfolded: string[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith(" ") || line.startsWith("\t")) {
      if (unfolded.length) {
        unfolded[unfolded.length - 1] += line.slice(1);
      }
    } else {
      unfolded.push(line);
    }
  }

  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of unfolded) {
    if (line.startsWith("BEGIN:VCARD")) {
      current = [line];
    } else if (line.startsWith("END:VCARD")) {
      current.push(line);
      blocks.push(current.join("\r\n"));
      current = [];
    } else if (current.length) {
      current.push(line);
    }
  }
  return blocks.filter(Boolean);
}

function parseVCardBlock(block: string): ParsedVCardContact | null {
  const result: ParsedVCardContact = { emails: [], tels: [], adrs: [] };
  const lines = block.split(/\r?\n/).filter(Boolean);

  for (const line of lines) {
    if (line.startsWith("BEGIN:VCARD") || line.startsWith("END:VCARD")) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;

    const before = line.slice(0, colonIdx);
    const value = unescapeVCardValue(line.slice(colonIdx + 1).trim());

    const semicolonIdx = before.indexOf(";");
    const prop = semicolonIdx >= 0 ? before.slice(0, semicolonIdx) : before;
    const params = semicolonIdx >= 0 ? before.slice(semicolonIdx + 1) : "";

    const getParam = (name: string) => {
      const re = new RegExp(`${name}=([^;]+)`, "i");
      const m = params.match(re);
      return m ? m[1] : undefined;
    };

    switch (prop.toUpperCase()) {
      case "UID":
        result.uid = value;
        break;
      case "FN":
        result.fn = value;
        break;
      case "N":
        {
          const parts = value.split(";");
          result.n = { family: parts[0], given: parts[1], additional: parts[2], prefix: parts[3], suffix: parts[4] };
        }
        break;
      case "ORG":
        result.org = value;
        break;
      case "TITLE":
        result.title = value;
        break;
      case "EMAIL":
        {
          const type = getParam("TYPE")?.toLowerCase();
          const pref = getParam("PREF") ? parseInt(getParam("PREF")!, 10) : undefined;
          result.emails.push({ value, type, pref });
        }
        break;
      case "TEL":
        {
          const type = getParam("TYPE")?.toLowerCase();
          const pref = getParam("PREF") ? parseInt(getParam("PREF")!, 10) : undefined;
          result.tels.push({ value: value.replace(/\s/g, ""), type, pref });
        }
        break;
      case "ADR":
        {
          const type = getParam("TYPE")?.toLowerCase();
          const pref = getParam("PREF") ? parseInt(getParam("PREF")!, 10) : undefined;
          const parts = value.split(";");
          const line2 = [parts[0], parts[1]].filter(Boolean).join(", ") || undefined;
          result.adrs.push({
            line1: parts[2] || undefined,
            line2: line2 || undefined,
            city: parts[3] || undefined,
            state: parts[4] || undefined,
            postalCode: parts[5] || undefined,
            country: parts[6] || undefined,
            type,
            pref,
          });
        }
        break;
      case "NOTE":
        result.note = value;
        break;
      case "CATEGORIES":
        result.categories = value.split(",").map((s) => s.trim()).filter(Boolean);
        break;
    }
  }

  if (!result.fn && !result.n?.given && !result.n?.family && !result.org) return null;
  return result;
}

/** Parse vCard file content into ParsedVCardContact array */
export function parseVCardFile(content: string): ParsedVCardContact[] {
  const blocks = splitVCardBlocks(content);
  const results: ParsedVCardContact[] = [];
  for (const block of blocks) {
    const parsed = parseVCardBlock(block);
    if (parsed) results.push(parsed);
  }
  return results;
}

/** Convert ParsedVCardContact to Contact create payload */
export function parsedToContactPayload(p: ParsedVCardContact): Partial<Contact> & { display_name: string } {
  const displayName =
    p.fn ||
    [p.n?.given, p.n?.family].filter(Boolean).join(" ") ||
    p.org ||
    "Unknown";

  const emails: ContactEmail[] = p.emails
    .sort((a, b) => (b.pref ?? 0) - (a.pref ?? 0))
    .map((e, i) => ({
      id: "",
      contact_id: "",
      email: e.value,
      type: (e.type as ContactEmail["type"]) ?? "other",
      is_primary: i === 0,
    }));

  const addresses: ContactAddress[] = p.adrs.map((a, i) => ({
    id: "",
    contact_id: "",
    address_line1: a.line1 ?? null,
    address_line2: a.line2 ?? null,
    city: a.city ?? null,
    state: a.state ?? null,
    postal_code: a.postalCode ?? null,
    country: a.country ?? "US",
    type: (a.type as ContactAddress["type"]) ?? "home",
    is_primary_mailing: i === 0 || (a.pref ?? 0) > 0,
  }));

  const [given, family] = p.n ? [p.n.given, p.n.family] : [undefined, undefined];

  return {
    type: p.org && !p.n?.given && !p.n?.family ? "organization" : "person",
    display_name: displayName,
    first_name: given ?? null,
    last_name: family ?? null,
    organization_name: p.org ?? null,
    role: p.title ?? null,
    notes: p.note ?? null,
    emails,
    phones: p.tels.map((t, i) => ({
      id: "",
      contact_id: "",
      phone: t.value,
      type: (t.type as "work" | "home" | "cell" | "other") ?? "other",
      is_primary: i === 0,
    })),
    addresses,
    tags: p.categories?.map((name) => ({ id: "", name })) ?? [],
  };
}
