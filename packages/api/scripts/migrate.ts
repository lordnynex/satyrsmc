#!/usr/bin/env tsx
/**
 * Run database migrations.
 * Uses TypeORM's MigrationExecutor to run each pending migration with verbose logging.
 */
import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { MigrationExecutor } from "typeorm";
import { dataSourceOptions } from "../src/db/dataSource";
import { logger } from "../src/logger";

async function main() {
  logger.info("Running database migrations...");

  const ds = new DataSource({
    ...dataSourceOptions,
    migrationsRun: false,
  });
  await ds.initialize();

  const executor = new MigrationExecutor(ds);
  const pending = await executor.getPendingMigrations();

  if (pending.length === 0) {
    logger.info("No pending migrations.");
    await ds.destroy();
    process.exit(0);
    return;
  }

  logger.info({ count: pending.length }, "Pending migrations to run");
  for (const migration of pending) {
    logger.info(`Running migration: ${migration.name}`);
    await executor.executeMigration(migration);
    logger.info(`Completed migration: ${migration.name}`);
  }

  await ds.destroy();
  logger.info("Migrations complete");
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Migration failed");
  process.exit(1);
});
