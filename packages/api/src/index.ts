import "reflect-metadata";
import { join } from "path";
import { getDbInstance } from "./db/dbAdapter";
import { getDataSource, getProjectRoot } from "./db/dataSource";
import { createApi } from "./services/api";
import { createContextFn } from "./trpc/context";
import { createFetchHandler } from "./server";
import { logger } from "./logger";
import { seedPgliteFromSqlite } from "../scripts/lib/sqlite-to-postgres.ts";

const port = Number(process.env.PORT) || 3000;

async function main() {
  const db = await getDbInstance();
  const ds = await getDataSource();

  if (process.env.USE_PGLITE === "1") {
    const sqlitePath = process.env.SQLITE_SEED_PATH ?? join(getProjectRoot(), "data", "badger.db");
    if (await Bun.file(sqlitePath).exists()) {
      const count = await seedPgliteFromSqlite(ds, sqlitePath);
      logger.info({ sqlitePath, rows: count }, "Seeded PGlite from SQLite");
    }
  }

  const api = createApi(db, ds);
  const createContext = createContextFn({ api });
  const projectRoot = getProjectRoot();

  const fetch = createFetchHandler({
    api,
    createContext,
    serveFrontend: true,
    projectRoot,
  });

  Bun.serve({
    port,
    fetch: async (request, server) => fetch(request, server),
  });

  logger.info({ url: `http://localhost:${port}/` }, "Server running");
}

main();
