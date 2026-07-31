/**
 * Increment the first contiguous digit run in a formatted invoice number,
 * preserving dashes, slashes, spaces, and all other characters.
 *
 * Examples:
 *   "001-2026/27" → "002-2026/27"
 *   "INV-0001"    → "INV-0002"
 *   "0001"        → "0002"
 */
export const incrementFormattedInvoiceNumber = (value: string): string => {
  const match = value.match(/(\d+)/);
  if (!match || match.index === undefined) {
    return value;
  }

  const digits = match[1];
  const next = Number.parseInt(digits, 10);
  if (Number.isNaN(next)) {
    return value;
  }

  const replacement = String(next + 1).padStart(digits.length, '0');
  return value.slice(0, match.index) + replacement + value.slice(match.index + digits.length);
};

/** True when the configured next number already carries formatting (not digits-only). */
export const hasInvoiceNumberFormatting = (value: string): boolean => /[^0-9]/.test(value.trim());
