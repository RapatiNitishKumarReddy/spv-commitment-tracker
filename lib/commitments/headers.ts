import type { CommitmentCsvField } from "./types";

/** Required columns, exactly as specified for the commitments CSV. */
export const REQUIRED_HEADERS: readonly CommitmentCsvField[] = [
  "spv_name",
  "spv_target_usd",
  "investor_name",
  "investor_email",
  "commitment",
];

export type HeaderValidationResult =
  | { ok: true; columnIndex: Record<CommitmentCsvField, number> }
  | { ok: false; errors: string[] };

/**
 * Maps required columns to their position in the header row.
 *
 * Assumptions: header names are matched after trimming and lowercasing, column
 * order does not matter, and extra (unknown) columns are ignored.
 */
export function validateHeaders(headerFields: string[]): HeaderValidationResult {
  const normalized = headerFields.map((name) => name.trim().toLowerCase());
  const errors: string[] = [];

  const duplicates = [
    ...new Set(
      normalized.filter(
        (name, index) => name !== "" && normalized.indexOf(name) !== index,
      ),
    ),
  ];
  if (duplicates.length > 0) {
    errors.push(`Duplicate column(s) in header: ${duplicates.join(", ")}`);
  }

  const missing = REQUIRED_HEADERS.filter((name) => !normalized.includes(name));
  if (missing.length > 0) {
    errors.push(
      `Missing required column(s): ${missing.join(", ")}. Expected header: ${REQUIRED_HEADERS.join(",")}`,
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const columnIndex = Object.fromEntries(
    REQUIRED_HEADERS.map((name) => [name, normalized.indexOf(name)]),
  ) as Record<CommitmentCsvField, number>;

  return { ok: true, columnIndex };
}
