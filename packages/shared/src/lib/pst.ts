/**
 * PST file parsing for Outlook contact import.
 * Uses pst-extractor to read .pst files and extract contacts.
 */

import { PSTFile, PSTFolder } from "pst-extractor";
import type { Contact, ContactEmail, ContactPhone, ContactAddress } from "../types/contact";

/** Minimal interface for PST contact items (IPM.Contact) from getNextChild */
interface PstContactLike {
  givenName?: string;
  surname?: string;
  displayName?: string;
  companyName?: string;
  title?: string;
  note?: string;
  email1EmailAddress?: string;
  email2EmailAddress?: string;
  email3EmailAddress?: string;
  businessTelephoneNumber?: string;
  homeTelephoneNumber?: string;
  mobileTelephoneNumber?: string;
  primaryTelephoneNumber?: string;
  businessAddressStreet?: string;
  businessAddressCity?: string;
  businessAddressStateOrProvince?: string;
  businessPostalCode?: string;
  businessAddressCountry?: string;
  homeAddressStreet?: string;
  homeAddressCity?: string;
  homeAddressStateOrProvince?: string;
  homeAddressPostalCode?: string;
  homeAddressCountry?: string;
  postalAddress?: string;
}

/** Contact payload for create - matches parsedToContactPayload output */
export type PstContactPayload = Partial<Contact> & { display_name: string };

/** Result of parsing a single PST contact */
export interface ParsedPstContact {
  payload: PstContactPayload;
  /** Primary email for deduplication */
  primaryEmail: string | null;
  /** Normalized address key for fuzzy matching */
  addressKey: string;
}

function trim(s: string | undefined): string {
  return (s ?? "").trim();
}

function orNull(s: string | undefined): string | null {
  const t = trim(s);
  return t ? t : null;
}

/** Recursively find the Contacts folder in the PST hierarchy */
function findContactsFolder(folder: PSTFolder): PSTFolder | null {
  const name = (folder as { displayName?: string }).displayName ?? "";
  const containerClass = (folder as { containerClass?: string }).containerClass ?? "";
  if (
    /contacts?/i.test(name) ||
    /contact\s*items?/i.test(name) ||
    /IPM\.Contact/i.test(containerClass)
  ) {
    return folder;
  }
  const subfolders = folder.getSubFolders?.() ?? [];
  for (const sub of subfolders) {
    const found = findContactsFolder(sub);
    if (found) return found;
  }
  return null;
}

/** Map PST contact item to our contact payload format */
function pstContactToPayload(contact: PstContactLike): PstContactPayload {
  const given = trim(contact.givenName);
  const surname = trim(contact.surname);
  const displayNameRaw = trim(contact.displayName);
  const company = trim(contact.companyName);
  const displayName =
    displayNameRaw ||
    [given, surname].filter(Boolean).join(" ") ||
    company ||
    "Unknown";

  const emails: ContactEmail[] = [];
  for (const [addr, type] of [
    [contact.email1EmailAddress, "work"],
    [contact.email2EmailAddress, "home"],
    [contact.email3EmailAddress, "other"],
  ] as const) {
    const e = trim(addr);
    if (e) {
      emails.push({
        id: "",
        contact_id: "",
        email: e,
        type,
        is_primary: emails.length === 0,
      });
    }
  }

  const phones: ContactPhone[] = [];
  for (const [num, type] of [
    [contact.businessTelephoneNumber, "work"],
    [contact.homeTelephoneNumber, "home"],
    [contact.mobileTelephoneNumber, "cell"],
    [contact.primaryTelephoneNumber, "other"],
  ] as const) {
    const p = trim(num)?.replace(/\s/g, "");
    if (p) {
      phones.push({
        id: "",
        contact_id: "",
        phone: p,
        type,
        is_primary: phones.length === 0,
      });
    }
  }

  const addresses: ContactAddress[] = [];
  const bizStreet = orNull(contact.businessAddressStreet);
  const bizCity = orNull(contact.businessAddressCity);
  const bizState = orNull(contact.businessAddressStateOrProvince);
  const bizPostal = orNull(contact.businessPostalCode);
  const bizCountry = orNull(contact.businessAddressCountry) || "US";
  const homeStreet = orNull(contact.homeAddressStreet);
  const homeCity = orNull(contact.homeAddressCity);
  const homeState = orNull(contact.homeAddressStateOrProvince);
  const homePostal = orNull(contact.homeAddressPostalCode);
  const homeCountry = orNull(contact.homeAddressCountry) || "US";

  /** Normalize address for duplicate detection (Outlook often stores same address in both business and home) */
  const addrKey = (line1: string | null, city: string | null, postal: string | null) =>
    [line1 ?? "", city ?? "", postal ?? ""]
      .map((s) => s.toLowerCase().replace(/\s+/g, " ").trim())
      .join("|");

  const bizKey = addrKey(bizStreet, bizCity, bizPostal);
  const homeKey = addrKey(homeStreet, homeCity, homePostal);
  const bizHasContent = bizStreet || bizCity || bizPostal;
  const homeHasContent = homeStreet || homeCity || homePostal;

  if (bizHasContent && homeHasContent && bizKey === homeKey) {
    // Same address in both fields - prefer home, skip work to avoid duplicates
    addresses.push({
      id: "",
      contact_id: "",
      address_line1: homeStreet,
      address_line2: null,
      city: homeCity,
      state: homeState,
      postal_code: homePostal,
      country: homeCountry,
      type: "home",
      is_primary_mailing: true,
    });
  } else {
    if (bizHasContent) {
      addresses.push({
        id: "",
        contact_id: "",
        address_line1: bizStreet,
        address_line2: null,
        city: bizCity,
        state: bizState,
        postal_code: bizPostal,
        country: bizCountry,
        type: "work",
        is_primary_mailing: true,
      });
    }
    if (homeHasContent) {
      addresses.push({
        id: "",
        contact_id: "",
        address_line1: homeStreet,
        address_line2: null,
        city: homeCity,
        state: homeState,
        postal_code: homePostal,
        country: homeCountry,
        type: "home",
        is_primary_mailing: addresses.length === 0,
      });
    }
  }

  if (addresses.length === 0 && contact.postalAddress) {
    const postal = trim(contact.postalAddress);
    if (postal) {
      addresses.push({
        id: "",
        contact_id: "",
        address_line1: postal,
        address_line2: null,
        city: null,
        state: null,
        postal_code: null,
        country: "US",
        type: "postal",
        is_primary_mailing: true,
      });
    }
  }

  const type =
    company && !given && !surname ? "organization" : "person";

  return {
    type,
    display_name: displayName,
    first_name: given || null,
    last_name: surname || null,
    organization_name: orNull(company) || null,
    role: orNull(contact.title) || null,
    notes: orNull(contact.note) || null,
    emails,
    phones,
    addresses,
  };
}

/** Extract contacts from a PST file. Caller must provide a file path (writable to disk for pst-extractor). */
export function extractContactsFromPst(filePath: string): ParsedPstContact[] {
  const pst = new PSTFile(filePath);
  const root = pst.getRootFolder();
  const contactsFolder = findContactsFolder(root);
  if (!contactsFolder) {
    return [];
  }

  const results: ParsedPstContact[] = [];
  const count = contactsFolder.contentCount ?? 0;
  contactsFolder.moveChildCursorTo(0);

  for (let i = 0; i < count; i++) {
    let child: unknown;
    try {
      child = contactsFolder.getNextChild();
    } catch {
      continue;
    }
    if (!child) break;
    const contact = child as PstContactLike;
    try {
      const payload = pstContactToPayload(contact);
      const primaryEmail =
        payload.emails?.[0]?.email?.toLowerCase().trim() ?? null;
      const addr = payload.addresses?.[0];
      const addressKey = [
        addr?.address_line1 ?? "",
        addr?.city ?? "",
        addr?.postal_code ?? "",
      ]
        .map((s) => (s ?? "").toLowerCase().replace(/\s+/g, " "))
        .join("|");
      if (payload.display_name || primaryEmail) {
        results.push({ payload, primaryEmail, addressKey });
      }
    } catch {
      continue;
    }
  }

  return results;
}
