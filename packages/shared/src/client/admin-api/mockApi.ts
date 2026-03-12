import type { Api } from "./index";

const stub = (): Promise<unknown> => Promise.resolve(undefined);
const stubList = (): Promise<unknown[]> => Promise.resolve([]);
const stubNull = (): Promise<null> => Promise.resolve(null);

/**
 * Creates a stub client object whose methods return empty/neutral values.
 * Used as the base for the mock API so any unused method is safe to call.
 */
function createStubClient(
  listDefault = stubList,
): Record<string, (...args: unknown[]) => Promise<unknown>> {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "list" || String(prop).startsWith("list")) return listDefault;
        if (prop === "get" || String(prop).startsWith("get")) return stubNull;
        return stub;
      },
    },
  );
}

function createStubApi(): Api {
  const s = createStubClient;
  return {
    events: s() as unknown as Api["events"],
    budgets: s() as unknown as Api["budgets"],
    members: s() as unknown as Api["members"],
    scenarios: s() as unknown as Api["scenarios"],
    contacts: s() as unknown as Api["contacts"],
    mailingLists: s() as unknown as Api["mailingLists"],
    mailingBatches: s() as unknown as Api["mailingBatches"],
    qrCodes: s() as unknown as Api["qrCodes"],
    meetings: s() as unknown as Api["meetings"],
    meetingTemplates: s() as unknown as Api["meetingTemplates"],
    documents: s() as unknown as Api["documents"],
    committees: s() as unknown as Api["committees"],
    website: s() as unknown as Api["website"],
    incidents: s() as unknown as Api["incidents"],
  };
}

/**
 * Merges overrides into base so that overridden methods are used but any
 * non-overridden method still falls back to the stub (avoids undefined when
 * a component calls e.g. mailingLists.get after we only overrode mailingLists.list).
 */
function mergeOverrides(base: Api, overrides: Partial<Api>): Api {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(overrides) as (keyof Api)[]) {
    const overrideVal = overrides[key];
    if (
      overrideVal &&
      typeof overrideVal === "object" &&
      typeof (overrideVal as unknown as Record<string, unknown>).then !== "function"
    ) {
      const baseClient = base[key] as unknown as Record<string, unknown>;
      const overrideClient = overrideVal as unknown as Record<string, unknown>;
      result[key] = new Proxy(baseClient, {
        get(target, prop) {
          if (
            typeof prop === "string" &&
            Object.prototype.hasOwnProperty.call(overrideClient, prop)
          ) {
            return overrideClient[prop];
          }
          return typeof prop === "string" ? (target as Record<string, unknown>)[prop] : undefined;
        },
      });
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal;
    }
  }
  return result as Api;
}

/**
 * Creates a mock API for Storybook or tests. All methods are stubbed with safe defaults
 * (empty arrays for list-like, null for get-like, undefined otherwise). Pass overrides
 * to customize specific clients or methods (e.g. mailingLists.list for ContactsLayout).
 */
export function createMockApi(overrides?: Partial<Api>): Api {
  const base = createStubApi();
  if (!overrides) return base;
  return mergeOverrides(base, overrides);
}
