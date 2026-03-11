/**
 * One-time data migration: SQLite (badger.db) → Postgres.
 *
 * Usage:
 *   DATABASE_URL=postgres://... bun run packages/api/scripts/migrate-sqlite-to-postgres.ts [path-to-badger.db]
 *
 * Prerequisite: Postgres baseline migration must have already run (tables exist).
 */
import { Database } from "bun:sqlite";
import { TABLES, convertValue } from "./lib/sqlite-to-postgres.ts";

const dbPath = process.argv[2] ?? "data/badger.db";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sqlite = new Database(dbPath, { readonly: true });

// Use Bun.sql for Postgres as per project conventions
const sql = new Bun.SQL(databaseUrl);

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
