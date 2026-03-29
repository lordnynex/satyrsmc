import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

async function createLogger(): Promise<pino.Logger> {
  let dest: pino.DestinationStream;
  if (!isDev) {
    dest = pino.destination(1);
  } else {
    try {
      const pretty = await import("pino-pretty");
      dest = pretty.default({ colorize: true, sync: true });
    } catch {
      dest = pino.destination({ dest: 1, minLength: 0 });
    }
  }
  return pino({ level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info") }, dest);
}

let _logger: pino.Logger | undefined;
let _initPromise: Promise<pino.Logger> | undefined;

function getLogger(): pino.Logger {
  if (_logger) return _logger;
  if (!_initPromise) {
    _initPromise = createLogger().then((l) => {
      _logger = l;
      return l;
    });
  }
  // Return a synchronous fallback until the async init completes
  return pino({ level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info") });
}

export type Logger = pino.Logger;
export const logger: pino.Logger = new Proxy({} as pino.Logger, {
  get(_target, prop) {
    return (getLogger() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
