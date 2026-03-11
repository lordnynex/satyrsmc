/**
 * PST import with deduplication.
 * Parses PST file, compares against existing contacts, returns preview.
 */

import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { extractContactsFromPst, type PstContactPayload } from "@satyrsmc/shared/lib/pst";

export type GetForDeduplication = () => Promise<
  Array<{ id: string; display_name: string; emails: string[]; addressKey: string; nameKey: string }>
>;

export interface PstImportPreviewItem {
  payload: PstContactPayload;
  status: "new" | "duplicate";
  existingContact?: { id: string; display_name: string };
}

/** Normalize for fuzzy comparison */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Check if two strings are fuzzy-equal (ignoring minor differences) */
function fuzzyMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

export async function previewPstImport(
  fileBuffer: Buffer,
  getForDeduplication: GetForDeduplication,
): Promise<PstImportPreviewItem[]> {
  const tmpPath = join(
    tmpdir(),
    `pst-import-${Date.now()}-${Math.random().toString(36).slice(2)}.pst`,
  );
  try {
    writeFileSync(tmpPath, fileBuffer);
    const parsed = extractContactsFromPst(tmpPath);
    const existing = await getForDeduplication();

    const emailToContact = new Map<string, { id: string; display_name: string }>();
    const addressKeyToContact = new Map<string, { id: string; display_name: string }>();
    const nameKeyToContact = new Map<string, { id: string; display_name: string }>();
    for (const c of existing) {
      for (const e of c.emails) {
        if (e) emailToContact.set(e, { id: c.id, display_name: c.display_name });
      }
      if (c.addressKey) {
        addressKeyToContact.set(c.addressKey, { id: c.id, display_name: c.display_name });
      }
      if (c.nameKey) {
        nameKeyToContact.set(c.nameKey, { id: c.id, display_name: c.display_name });
      }
    }

    const result: PstImportPreviewItem[] = [];
    for (const p of parsed) {
      let duplicateOf: { id: string; display_name: string } | undefined;

      if (p.primaryEmail) {
        duplicateOf = emailToContact.get(p.primaryEmail);
      }
      if (!duplicateOf && p.addressKey) {
        duplicateOf = addressKeyToContact.get(p.addressKey);
      }
      if (!duplicateOf && p.payload.display_name) {
        const nameKey = normalize(p.payload.display_name);
        duplicateOf = nameKeyToContact.get(nameKey);
      }
      if (!duplicateOf && p.addressKey && p.payload.display_name) {
        for (const [key, c] of addressKeyToContact) {
          if (
            key &&
            fuzzyMatch(key, p.addressKey) &&
            fuzzyMatch(p.payload.display_name, c.display_name)
          ) {
            duplicateOf = c;
            break;
          }
        }
      }

      result.push({
        payload: p.payload,
        status: duplicateOf ? "duplicate" : "new",
        existingContact: duplicateOf,
      });
    }

    return result;
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {
      // ignore cleanup errors
    }
  }
}
