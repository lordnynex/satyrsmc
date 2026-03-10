/**
 * Converts a Date (or null/undefined) to an ISO string for API responses.
 * Use in entity→shared-type mapper functions where the entity has TIMESTAMPTZ
 * columns (Date objects) but the shared type expects string.
 */
export function toISOString(d: Date | string | null | undefined): string | undefined {
  if (d instanceof Date) return d.toISOString();
  return d ?? undefined;
}

/**
 * Same as toISOString but returns null instead of undefined for nullable fields.
 */
export function toISOStringOrNull(d: Date | string | null | undefined): string | null {
  if (d instanceof Date) return d.toISOString();
  return d ?? null;
}
