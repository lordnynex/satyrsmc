import type { EventType } from "@satyrsmc/shared/client";

export const FOOD_CATEGORIES = ["Food & Beverage", "Food", "Beverage"];
export const EVENT_DAYS = 4;

export const EVENT_TYPES: EventType[] = ["badger", "anniversary", "pioneer_run", "rides"];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  badger: "Badger",
  anniversary: "Anniversary",
  pioneer_run: "Pioneer Run",
  rides: "Rides",
};

/** URL slug for each event type (for routing) */
export const EVENT_TYPE_SLUGS: Record<EventType, string> = {
  badger: "badger",
  anniversary: "anniversary",
  pioneer_run: "pioneer-run",
  rides: "rides",
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
