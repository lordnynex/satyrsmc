import "dotenv/config";
import "reflect-metadata";
import { existsSync } from "node:fs";
import { join } from "path";
import { getDbInstance } from "./db/dbAdapter";
import { getDataSource, getProjectRoot } from "./db/dataSource";
import { createApi } from "./services/api";
import { createExpressApp } from "./server";
import { logger } from "./logger";
import { seedPgliteFromSqlite } from "../scripts/lib/sqlite-to-postgres.ts";

const port = Number(process.env.PORT) || 4000;

async function main() {
  const db = await getDbInstance();
  const ds = await getDataSource();

  if (process.env.USE_PGLITE === "1") {
    const sqlitePath = process.env.SQLITE_SEED_PATH ?? join(getProjectRoot(), "data", "badger.db");
    if (existsSync(sqlitePath)) {
      const count = await seedPgliteFromSqlite(ds, sqlitePath);
      logger.info({ sqlitePath, rows: count }, "Seeded PGlite from SQLite");
    }
  }

  const api = createApi(db, ds);
  const app = createExpressApp({ api });

  app.listen(port, () => {
    logger.info({ url: `http://localhost:${port}/` }, "Server running");
  });
}

main();
