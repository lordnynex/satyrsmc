import type { Api } from "./index";

const stub = (): Promise<unknown> => Promise.resolve(undefined);
const stubList = (): Promise<unknown[]> => Promise.resolve([]);
const stubNull = (): Promise<null> => Promise.resolve(null);

/**
 * Creates a stub client object whose methods return empty/neutral values.
 * Used as the base for the mock API so any unused method is safe to call.
 */
function createStubClient(listDefault = stubList): Record<string, (...args: unknown[]) => Promise<unknown>> {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "list" || String(prop).startsWith("list")) return listDefault;
        if (prop === "get" || String(prop).startsWith("get")) return stubNull;
        return stub;
      },
    }
  );
}

function createStubApi(): Api {
  return {
    events: createStubClient() as Api["events"],
    budgets: createStubClient() as Api["budgets"],
    members: createStubClient() as Api["members"],
    scenarios: createStubClient() as Api["scenarios"],
    contacts: createStubClient() as Api["contacts"],
    mailingLists: createStubClient() as Api["mailingLists"],
    mailingBatches: createStubClient() as Api["mailingBatches"],
    qrCodes: createStubClient() as Api["qrCodes"],
    meetings: createStubClient() as Api["meetings"],
    meetingTemplates: createStubClient() as Api["meetingTemplates"],
    documents: createStubClient() as Api["documents"],
    committees: createStubClient() as Api["committees"],
    website: createStubClient() as Api["website"],
    incidents: createStubClient() as Api["incidents"],
  };
}

/**
 * Merges overrides into base so that overridden methods are used but any
 * non-overridden method still falls back to the stub (avoids undefined when
 * a component calls e.g. mailingLists.get after we only overrode mailingLists.list).
 */
function mergeOverrides(base: Api, overrides: Partial<Api>): Api {
  const result = { ...base };
  for (const key of Object.keys(overrides) as (keyof Api)[]) {
    const overrideVal = overrides[key];
    if (overrideVal && typeof overrideVal === "object" && typeof (overrideVal as Record<string, unknown>).then !== "function") {
      const baseClient = base[key] as Record<string, unknown>;
      const overrideClient = overrideVal as Record<string, unknown>;
      result[key] = new Proxy(baseClient, {
        get(target, prop) {
          if (Object.prototype.hasOwnProperty.call(overrideClient, prop)) {
            return overrideClient[prop];
          }
          return (target as Record<string, unknown>)[prop as string];
        },
      }) as Api[keyof Api];
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal as Api[keyof Api];
    }
  }
  return result;
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
