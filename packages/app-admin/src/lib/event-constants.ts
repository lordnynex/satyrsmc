import { EventType } from "@satyrsmc/shared/client";

export const FOOD_CATEGORIES = ["Food & Beverage", "Food", "Beverage"];
export const EVENT_DAYS = 4;

export const EVENT_TYPES = Object.values(EventType);

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.Badger]: "Badger",
  [EventType.Anniversary]: "Anniversary",
  [EventType.PioneerRun]: "Pioneer Run",
  [EventType.Rides]: "Rides",
};

/** URL slug for each event type (for routing) */
export const EVENT_TYPE_SLUGS: Record<EventType, string> = {
  [EventType.Badger]: "badger",
  [EventType.Anniversary]: "anniversary",
  [EventType.PioneerRun]: "pioneer-run",
  [EventType.Rides]: "rides",
};

export const EVENT_TYPE_FROM_SLUG: Record<string, EventType> = Object.fromEntries(
  EVENT_TYPES.map((t) => [EVENT_TYPE_SLUGS[t], t]),
) as Record<string, EventType>;

export function isFoodCategory(category: string): boolean {
  return FOOD_CATEGORIES.includes(category);
}

export function isEventTypeSlug(slug: string): boolean {
  return slug in EVENT_TYPE_FROM_SLUG;
}
