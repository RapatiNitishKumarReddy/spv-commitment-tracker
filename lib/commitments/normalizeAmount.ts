/**
 * Normalizes a human-entered USD amount into a number.
 *
 * Supported formats (optionally prefixed with `$`):
 *   50000, 50,000, $50,000, 50000.50
 *   100k / 100K  → × 1,000
 *   1.5L / 1.5l  → × 100,000 (lakh)
 *
 * Rejected, never guessed:
 *   blank values, negative values (`-`, `$-`, `-$`, `(…)`), zero,
 *   malformed separators (`5,0,00`), unknown suffixes (`10m`) and anything
 *   else that does not match the grammar above.
 *
 * Assumption: a commitment or target must be a positive amount, so `0` is
 * rejected.
 */

export type AmountErrorCode = "missing" | "negative" | "zero" | "invalid";

export type AmountResult =
  | { ok: true; value: number }
  | { ok: false; code: AmountErrorCode; message: string };

const MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  l: 100_000,
};

// $? then digits (with well-formed thousands separators, or none), an
// optional decimal part and an optional k/L suffix.
const AMOUNT_PATTERN =
  /^\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?\s*([kKlL])?$/;

function parseUnsignedAmount(text: string): number | null {
  const match = AMOUNT_PATTERN.exec(text);
  if (!match) return null;

  const [, integerPart, fractionPart, suffix] = match;
  const base = Number(`${integerPart.replace(/,/g, "")}.${fractionPart ?? "0"}`);
  const multiplier = suffix ? MULTIPLIERS[suffix.toLowerCase()] : 1;
  const value = Math.round(base * multiplier * 100) / 100;

  return Number.isFinite(value) ? value : null;
}

/** Returns the unsigned part if `text` is written as a negative amount. */
function stripNegativeSign(text: string): string | null {
  const parenthesized = /^\((.*)\)$/.exec(text);
  if (parenthesized) return parenthesized[1].trim();
  if (text.startsWith("-")) return text.slice(1).trim();
  const dollarMinus = /^\$\s*-(.*)$/.exec(text);
  if (dollarMinus) return `$${dollarMinus[1].trim()}`;
  return null;
}

export function normalizeAmount(
  raw: string,
  label = "Amount",
): AmountResult {
  const text = raw.trim();

  if (text === "") {
    return { ok: false, code: "missing", message: `${label} is missing` };
  }

  const unsigned = stripNegativeSign(text);
  if (unsigned !== null && parseUnsignedAmount(unsigned) !== null) {
    return {
      ok: false,
      code: "negative",
      message: `${label} cannot be negative ('${text}')`,
    };
  }

  const value = parseUnsignedAmount(text);
  if (value === null) {
    return {
      ok: false,
      code: "invalid",
      message: `${label} '${text}' is not a valid amount. Expected formats like 50000, $50,000, 100k or 1.5L`,
    };
  }

  if (value === 0) {
    return {
      ok: false,
      code: "zero",
      message: `${label} must be greater than zero`,
    };
  }

  return { ok: true, value };
}
