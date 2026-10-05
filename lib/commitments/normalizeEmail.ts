export type EmailResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

// Pragmatic check: something@domain.tld, no whitespace, exactly one "@".
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trims and lowercases an email, then checks its format. */
export function normalizeEmail(raw: string): EmailResult {
  const value = raw.trim().toLowerCase();

  if (value === "") {
    return { ok: false, message: "Investor email is missing" };
  }

  if (!EMAIL_PATTERN.test(value)) {
    return {
      ok: false,
      message: `Investor email '${raw.trim()}' is not a valid email address`,
    };
  }

  return { ok: true, value };
}
