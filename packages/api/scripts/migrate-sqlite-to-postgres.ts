/**
 * One-time data migration: SQLite (badger.db) → Postgres.
 *
 * Usage:
 *   DATABASE_URL=postgres://... bun run packages/api/scripts/migrate-sqlite-to-postgres.ts [path-to-badger.db]
 *
 * Prerequisite: Postgres baseline migration must have already run (tables exist).
 */
import { Database } from "bun:sqlite";

const dbPath = process.argv[2] ?? "data/badger.db";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sqlite = new Database(dbPath, { readonly: true });

// Use Bun.sql for Postgres as per project conventions
const sql = new Bun.SQL(databaseUrl);

/** Columns that should be converted from TEXT → TIMESTAMPTZ */
const TIMESTAMP_COLUMNS = new Set([
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
const BOOLEAN_COLUMNS = new Set([
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
const TABLES = [
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

function convertValue(column: string, value: unknown): unknown {
  if (value === null || value === undefined) return null;

  if (TIMESTAMP_COLUMNS.has(column)) {
    // SQLite stores dates as ISO text strings
    const str = String(value);
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  if (BOOLEAN_COLUMNS.has(column)) {
    return value === 1 || value === true;
  }

  // BLOB → Buffer (already a Buffer from bun:sqlite)
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return Buffer.from(value);
  }

  return value;
}

async function migrateTable(table: string): Promise<number> {
  const rows = sqlite.query(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];

  if (rows.length === 0) {
    console.info(`  ${table}: 0 rows (empty)`);
    return 0;
  }

  const columns = Object.keys(rows[0] as Record<string, unknown>);

  for (const row of rows) {
    const values = columns.map((col) => convertValue(col, row[col]));
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const colNames = columns.map((c) => `"${c}"`).join(", ");

    await sql.unsafe(
      `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
      values,
    );
  }

  console.info(`  ${table}: ${rows.length} rows migrated`);
  return rows.length;
}

async function main() {
  console.info(`Migrating data from ${dbPath} to Postgres...`);
  console.info("");

  let totalRows = 0;
  for (const table of TABLES) {
    try {
      totalRows += await migrateTable(table);
    } catch (error) {
      console.error(`  ERROR migrating ${table}:`, error);
    }
  }

  console.info("");
  console.info(`Done. ${totalRows} total rows migrated.`);

  sqlite.close();
  await sql.close();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
