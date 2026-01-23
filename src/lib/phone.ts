/**
 * Phone normalization helpers.
 *
 * We keep these string-only so they can be shared between server and client safely.
 */

/**
 * Normalize Egyptian mobile phone numbers into a canonical local format:
 * - Output: `01XXXXXXXXX` (11 digits)
 * - Accepts common inputs:
 *   - `01XXXXXXXXX`
 *   - `1XXXXXXXXX` (will be normalized to `01XXXXXXXXX`)
 *   - `+201XXXXXXXXX`
 *   - `201XXXXXXXXX`
 *   - `00201XXXXXXXXX`
 *   - With separators: spaces / `-` / `(` / `)`
 */
export function normalizeEgyptianMobile(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let cleaned = String(phone).trim();
  if (!cleaned) return null;

  // Remove common separators
  cleaned = cleaned.replace(/[\s\-\(\)]/g, "");

  // Normalize international prefixes into local format
  if (cleaned.startsWith("0020")) {
    cleaned = `0${cleaned.slice(4)}`; // 0020 + 1XXXXXXXXX => 01XXXXXXXXX
  } else if (cleaned.startsWith("+20")) {
    cleaned = `0${cleaned.slice(3)}`; // +20 + 1XXXXXXXXX => 01XXXXXXXXX
  } else if (cleaned.startsWith("20")) {
    cleaned = `0${cleaned.slice(2)}`; // 20 + 1XXXXXXXXX => 01XXXXXXXXX
  } else if (/^1\d{9}$/.test(cleaned)) {
    cleaned = `0${cleaned}`; // 1XXXXXXXXX => 01XXXXXXXXX
  }

  // Canonical Egyptian mobile format: 01 + 9 digits
  if (!/^01\d{9}$/.test(cleaned)) return null;
  return cleaned;
}

