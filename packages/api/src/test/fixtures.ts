import { uuid } from "../services/utils";

export function createContactInput(overrides: Record<string, unknown> = {}) {
  return {
    display_name: `Test Contact ${uuid().slice(0, 6)}`,
    type: "person" as const,
    first_name: "Test",
    last_name: "Contact",
    emails: [],
    phones: [],
    addresses: [],
    tags: [],
    ...overrides,
  };
}

export function createMemberInput(overrides: Record<string, unknown> = {}) {
  return {
    name: `Test Member ${uuid().slice(0, 6)}`,
    ...overrides,
  };
}

export function createEventInput(overrides: Record<string, unknown> = {}) {
  return {
    name: `Test Event ${uuid().slice(0, 6)}`,
    event_type: "badger" as const,
    ...overrides,
  };
}

export function createBudgetInput(overrides: Record<string, unknown> = {}) {
  return {
    name: `Test Budget ${uuid().slice(0, 6)}`,
    year: 2025,
    ...overrides,
  };
}
