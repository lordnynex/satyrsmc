import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

async function createDest(): Promise<pino.DestinationStream> {
  if (!isDev) return pino.destination(1);
  try {
    const pretty = await import("pino-pretty");
    return pretty.default({ colorize: true, sync: true });
  } catch {
    return pino.destination({ dest: 1, minLength: 0 });
  }
}

/**
 * Shared Pino logger. In development uses pino-pretty for readable output;
 * in production logs JSON to stdout.
 */
const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  },
  await createDest(),
);

export type Logger = pino.Logger;
export { logger };
