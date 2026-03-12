import type { DataSource } from "typeorm";
import { getDataSource } from "./dataSource";

export interface DbLike {
  query(
    sql: string,
    ...bound: unknown[]
  ): {
    get(...args: unknown[]): Promise<unknown>;
    all(...args: unknown[]): Promise<unknown[]>;
  };
  run(sql: string, params?: unknown[]): Promise<void>;
}

const globalForDb = globalThis as unknown as { __badgerDbInstancePromise?: Promise<DbLike> };

/**
 * Converts `?` placeholders to Postgres-style `$1, $2, ...` parameters.
 * Skips `?` inside single-quoted string literals.
 */
function toPostgresParams(sql: string): string {
  let idx = 0;
  let inString = false;
  let result = "";
  for (let i = 0; i < sql.length; i++) {
    const ch = sql.charAt(i);
    if (ch === "'" && !inString) {
      inString = true;
      result += ch;
    } else if (ch === "'" && inString) {
      if (i + 1 < sql.length && sql.charAt(i + 1) === "'") {
        result += "''";
        i++;
      } else {
        inString = false;
        result += ch;
      }
    } else if (ch === "?" && !inString) {
      idx++;
      result += `$${idx}`;
    } else {
      result += ch;
    }
  }
  return result;
}

export function makeDbLike(ds: DataSource): DbLike {
  return {
    query(sql: string, ...bound: unknown[]) {
      const pgSql = toPostgresParams(sql);
      return {
        get: async (...args: unknown[]) => {
          const flat = [...bound, ...args].flat();
          const rows = await ds.query(pgSql, flat as unknown[]);
          return Array.isArray(rows) ? rows[0] : rows;
        },
        all: async (...args: unknown[]) => {
          const flat = [...bound, ...args].flat();
          const rows = await ds.query(pgSql, flat as unknown[]);
          return Array.isArray(rows) ? rows : [];
        },
      };
    },
    run: async (sql: string, params: unknown[] = []) => {
      await ds.query(toPostgresParams(sql), params as unknown[]);
    },
  };
}

/**
 * Returns the single DB instance. Call once at startup and inject the result everywhere.
 * No further connection setup happens inside this or in the returned DbLike.
 */
export async function getDbInstance(): Promise<DbLike> {
  if (!globalForDb.__badgerDbInstancePromise) {
    const ds = await getDataSource();
    globalForDb.__badgerDbInstancePromise = Promise.resolve(makeDbLike(ds));
  }
  return globalForDb.__badgerDbInstancePromise;
}
