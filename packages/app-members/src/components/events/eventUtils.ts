import { MONTHS } from "@/lib/date-utils";

export { MONTHS };

/** Format date string (YYYY-MM-DD or ISO) for display, e.g. "March 10, 2025". */
export function formatDueDate(d: string) {
  const dateOnly = typeof d === "string" && d.length >= 10 ? d.slice(0, 10) : d;
  const parts = dateOnly.split("-");
  const y = parts[0];
  const mo = parts[1];
  const day = parts[2];
  if (!y || !mo || !day) return d;
  return `${MONTHS[parseInt(mo, 10) - 1] ?? mo} ${day}, ${y}`;
}

export function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0);
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
}
