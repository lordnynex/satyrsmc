/**
 * Format a phone number consistently.
 * - US 10-digit: (XXX) XXX-XXXX
 * - US 11-digit with leading 1: +1 (XXX) XXX-XXXX
 * - International: +X XXX XXX XXXX (groups of 3)
 * - Invalid/short: returns digits only (cleaned)
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "";

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length >= 11) {
    const country = digits.slice(0, -10);
    const rest = digits.slice(-10);
    return `+${country} (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`;
  }
  if (digits.length >= 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

/**
 * Validate that a string looks like a valid phone number (has enough digits).
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
}

/**
 * Normalize phone to digits-only for consistent storage.
 */
export function normalizePhoneForStorage(phone: string | null | undefined): string {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/\D/g, "");
}
