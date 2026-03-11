import dayjs from "dayjs";

/** Format a date string for locale display (e.g. 11/29/2025). Accepts ISO or YYYY-MM-DD. */
export function formatDateOnly(dateStr: string): string {
  if (!dateStr) return "";
  return dayjs(dateStr).format("M/D/YYYY");
}

/**
 * Normalize API date/datetime to YYYY-MM-DD for input type="date".
 * Handles full ISO (e.g. 2025-03-10T00:00:00.000Z) or date-only strings.
 */
export function toDateOnly(s: string | null | undefined): string {
  if (!s || typeof s !== "string") return "";
  const slice = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : "";
}

/**
 * Normalize API datetime to YYYY-MM-DDTHH:mm for input type="datetime-local" (local time).
 * Handles full ISO strings; returns empty string if invalid.
 */
export function toDateTimeLocal(s: string | null | undefined): string {
  if (!s || typeof s !== "string") return "";
  const d = dayjs(s);
  if (!d.isValid()) return "";
  return d.format("YYYY-MM-DDTHH:mm");
}

/**
 * Format API datetime string for display (e.g. "Mar 10, 2025, 2:30 PM"). Accepts ISO.
 */
export function formatDateTime(s: string | null | undefined): string {
  if (!s || typeof s !== "string") return "";
  const d = dayjs(s);
  if (!d.isValid()) return s;
  return d.format("M/D/YYYY, h:mm A");
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
