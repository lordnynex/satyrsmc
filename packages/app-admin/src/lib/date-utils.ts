import dayjs from "dayjs";

/** Format a date string for locale display (e.g. 11/29/2025). */
export function formatDateOnly(dateStr: string): string {
  if (!dateStr) return "";
  return dayjs(dateStr).format("M/D/YYYY");
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
