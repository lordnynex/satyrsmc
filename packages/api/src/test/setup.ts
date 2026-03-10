import "reflect-metadata";
import { DataSource } from "typeorm";
import type { DataSourceOptions } from "typeorm";
import { PGliteDriver } from "typeorm-pglite";
import { dataSourceOptions } from "../db/dataSource";
import { makeDbLike } from "../db/dbAdapter";
import type { DbLike } from "../db/dbAdapter";
import { createApi } from "../services/api";
import type { Api } from "../services/api";

/**
 * Initializes PGlite + TypeORM for integration tests.
 * Call in beforeAll(). Creates an in-memory Postgres via PGlite,
 * runs migrations, and wires up the full Api service layer.
 *
 * Each call returns a fully isolated database instance — safe for
 * parallel test files.
 */
export async function setupTestDb(): Promise<{ ds: DataSource; db: DbLike; api: Api }> {
  const ds = new DataSource({
    ...dataSourceOptions,
    name: `test-${Date.now()}`,
    url: undefined,
    driver: new PGliteDriver().driver,
    migrationsRun: true,
    synchronize: false,
  } as DataSourceOptions);

  await ds.initialize();

  const db = makeDbLike(ds);
  const api = createApi(db, ds);

  return { ds, db, api };
}

/**
 * Tears down the test database. Call in afterAll().
 */
export async function teardownTestDb(ds: DataSource): Promise<void> {
  if (ds?.isInitialized) {
    await ds.destroy();
  }
}

/**
 * Truncates all tables for test isolation. Call in beforeEach().
 * Uses TRUNCATE CASCADE to handle foreign key constraints.
 */
export async function resetTestDb(ds: DataSource): Promise<void> {
  const tables = await ds.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != 'migrations'
  `);
  if (tables.length > 0) {
    const tableNames = tables
      .map((t: { tablename: string }) => `"${t.tablename}"`)
      .join(", ");
    await ds.query(`TRUNCATE ${tableNames} CASCADE`);
  }
}
