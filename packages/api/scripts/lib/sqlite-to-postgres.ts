/**
 * Shared helpers for SQLite → Postgres data migration.
 * Used by migrate-sqlite-to-postgres.ts and by API startup when seeding PGlite from SQLite.
 */
import type { DataSource } from "typeorm";

/** Columns that should be converted from TEXT → TIMESTAMPTZ */
export const TIMESTAMP_COLUMNS = new Set([
  "created_at",
  "updated_at",
  "deleted_at",
  "event_date",
  "birthday",
  "member_since",
  "due_date",
  "completed_at",
  "closed_at",
  "published_at",
  "occurred_at",
  "scheduled_time",
  "formed_date",
  "closed_date",
  "date",
  "start_time",
  "end_time",
  "added_at",
]);

/** Columns that should be converted from INTEGER (0/1) → BOOLEAN */
export const BOOLEAN_COLUMNS = new Set([
  "do_not_contact",
  "hellenic",
  "deceased",
  "is_primary",
  "is_primary_mailing",
  "is_baby",
  "show_on_website",
  "waiver_signed",
  "loaded",
  "completed",
  "suppressed",
  "unsubscribed",
]);

/** Tables in FK-dependency order (parents before children) */
export const TABLES = [
  "events",
  "members",
  "budgets",
  "scenarios",
  "tags",
  "contacts",
  "documents",
  "event_planning_milestones",
  "event_milestone_members",
  "event_packing_categories",
  "event_packing_items",
  "event_volunteers",
  "event_assignments",
  "event_assignment_members",
  "event_attendees",
  "event_ride_member_attendees",
  "event_photos",
  "event_assets",
  "ride_schedule_items",
  "line_items",
  "contact_emails",
  "contact_phones",
  "contact_addresses",
  "contact_tags",
  "contact_notes",
  "contact_photos",
  "contact_emergency_contacts",
  "mailing_lists",
  "mailing_list_members",
  "mailing_batches",
  "mailing_batch_recipients",
  "qr_codes",
  "document_versions",
  "meetings",
  "meeting_motions",
  "meeting_action_items",
  "old_business_items",
  "meeting_templates",
  "committees",
  "committee_members",
  "committee_meetings",
  "site_pages",
  "site_settings",
  "site_menu_items",
  "blog_posts",
  "contact_submissions",
  "contact_member_submissions",
  "incidents",
];

export function convertValue(column: string, value: unknown): unknown {
  // Boolean columns: NOT NULL in Postgres, so coerce null/undefined to false
  if (BOOLEAN_COLUMNS.has(column)) {
    if (value === null || value === undefined) return false;
    return value === 1 || value === true;
  }

  if (value === null || value === undefined) return null;

  if (TIMESTAMP_COLUMNS.has(column)) {
    // SQLite datetime('now') produces 'YYYY-MM-DD HH:MM:SS' (no T, no Z)
    const str = String(value);
    if (!str) return null;
    const normalized = str.includes("T") ? str : str.replace(" ", "T") + "Z";
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }

  // BLOB → Buffer (already a Buffer from bun:sqlite)
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return Buffer.from(value);
  }

  return value;
}

/**
 * Seeds an initialized PGlite DataSource from a SQLite file.
 * Reads each table in FK order, converts values, and inserts via the DataSource.
 * Skips tables that don't exist in SQLite or have no rows.
 */
export async function seedPgliteFromSqlite(ds: DataSource, sqlitePath: string): Promise<number> {
  const { Database } = await import("bun:sqlite");
  const sqlite = new Database(sqlitePath, { readonly: true });
  let totalRows = 0;

  try {
    for (const table of TABLES) {
      try {
        const rows = sqlite.query(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
        if (rows.length === 0) continue;

        const columns = Object.keys(rows[0] as Record<string, unknown>);
        const colNames = columns.map((c) => `"${c}"`).join(", ");
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        const sql = `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

        for (const row of rows) {
          const values = columns.map((col) => convertValue(col, row[col]));
          await ds.query(sql, values);
          totalRows += 1;
        }
      } catch (err) {
        // Table may not exist in older SQLite DBs
        if (String(err).includes("no such table")) continue;
        throw err;
      }
    }
  } finally {
    sqlite.close();
  }

  return totalRows;
}
