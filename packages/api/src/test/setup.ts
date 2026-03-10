import "reflect-metadata";
import { DataSource } from "typeorm";
import { PGliteDriver } from "typeorm-pglite";
import { dataSourceOptions } from "../db/dataSource";
import { makeDbLike } from "../db/dbAdapter";
import type { DbLike } from "../db/dbAdapter";
import { createApi } from "../services/api";
import type { Api } from "../services/api";

let dataSource: DataSource;
let db: DbLike;
let api: Api;

/**
 * Initializes PGlite + TypeORM for integration tests.
 * Call in beforeAll(). Creates an in-memory Postgres via PGlite,
 * runs migrations, and wires up the full Api service layer.
 */
export async function setupTestDb(): Promise<{ ds: DataSource; db: DbLike; api: Api }> {
  dataSource = new DataSource({
    ...dataSourceOptions,
    name: `test-${Date.now()}`,
    url: undefined,
    driver: new PGliteDriver().driver,
    migrationsRun: true,
    synchronize: false,
  } as Parameters<typeof DataSource.prototype.setOptions>[0]);

  await dataSource.initialize();

  db = makeDbLike(dataSource);
  api = createApi(db, dataSource);

  return { ds: dataSource, db, api };
}

/**
 * Tears down the test database. Call in afterAll().
 */
export async function teardownTestDb(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}

/**
 * Truncates all tables for test isolation. Call in beforeEach().
 * Uses TRUNCATE CASCADE to handle foreign key constraints.
 */
export async function resetTestDb(): Promise<void> {
  const tables = await dataSource.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != 'migrations'
  `);
  if (tables.length > 0) {
    const tableNames = tables
      .map((t: { tablename: string }) => `"${t.tablename}"`)
      .join(", ");
    await dataSource.query(`TRUNCATE ${tableNames} CASCADE`);
  }
}

export function getTestApi(): Api {
  return api;
}

export function getTestDb(): DbLike {
  return db;
}

export function getTestDataSource(): DataSource {
  return dataSource;
}
