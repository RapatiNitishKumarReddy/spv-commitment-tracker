import { CsvParseError, parseCsv, type CsvRecord } from "../csv/parseCsv";
import {
  detectSpvTargetConflicts,
  toSpvKey,
  type SpvTargetStatement,
} from "./detectSpvTargetConflicts";
import { REQUIRED_HEADERS, validateHeaders } from "./headers";
import { normalizeAmount } from "./normalizeAmount";
import { normalizeEmail } from "./normalizeEmail";
import type {
  CommitmentCsvField,
  Commitment,
  ImportResult,
  RawCommitmentRow,
  RowIssue,
  RowIssueReason,
} from "./types";

interface ValidatedRow {
  raw: RawCommitmentRow;
  reasons: RowIssueReason[];
  /** Present when the row's SPV name and target are both valid. */
  spvStatement?: SpvTargetStatement;
  /** Present when the whole row is valid. */
  commitment?: Commitment;
}

function emptyResult(fileErrors: string[], totalRows = 0): ImportResult {
  return {
    fileErrors,
    totalRows,
    accepted: [],
    flagged: [],
    rejected: [],
    spvConflicts: [],
  };
}

function toRawRow(
  record: CsvRecord,
  columnIndex: Record<CommitmentCsvField, number>,
): RawCommitmentRow {
  const value = (field: CommitmentCsvField) =>
    (record.fields[columnIndex[field]] ?? "").trim();

  return {
    lineNumber: record.lineNumber,
    spv_name: value("spv_name"),
    spv_target_usd: value("spv_target_usd"),
    investor_name: value("investor_name"),
    investor_email: value("investor_email"),
    commitment: value("commitment"),
  };
}

function validateRow(
  record: CsvRecord,
  columnIndex: Record<CommitmentCsvField, number>,
  expectedColumnCount: number,
): ValidatedRow {
  const raw = toRawRow(record, columnIndex);

  // With the wrong number of columns we cannot trust which value belongs to
  // which field, so report only the structural problem.
  if (record.fields.length !== expectedColumnCount) {
    return {
      raw,
      reasons: [
        {
          field: "row",
          message: `Row has ${record.fields.length} column(s), expected ${expectedColumnCount}`,
        },
      ],
    };
  }

  const reasons: RowIssueReason[] = [];

  if (raw.spv_name === "") {
    reasons.push({ field: "spv_name", message: "SPV name is missing" });
  }

  const target = normalizeAmount(raw.spv_target_usd, "SPV target");
  if (!target.ok) {
    reasons.push({ field: "spv_target_usd", message: target.message });
  }

  if (raw.investor_name === "") {
    reasons.push({ field: "investor_name", message: "Investor name is missing" });
  }

  const email = normalizeEmail(raw.investor_email);
  if (!email.ok) {
    reasons.push({ field: "investor_email", message: email.message });
  }

  const amount = normalizeAmount(raw.commitment, "Commitment");
  if (!amount.ok) {
    reasons.push({ field: "commitment", message: amount.message });
  }

  const spvKey = toSpvKey(raw.spv_name);
  const spvStatement =
    raw.spv_name !== "" && target.ok
      ? {
          lineNumber: raw.lineNumber,
          spvKey,
          spvName: raw.spv_name,
          targetUsd: target.value,
        }
      : undefined;

  const commitment =
    reasons.length === 0 && target.ok && email.ok && amount.ok
      ? {
          lineNumber: raw.lineNumber,
          spvName: raw.spv_name,
          spvKey,
          spvTargetUsd: target.value,
          investorName: raw.investor_name,
          investorEmail: email.value,
          commitmentUsd: amount.value,
        }
      : undefined;

  return { raw, reasons, spvStatement, commitment };
}

/**
 * Parses and validates a commitments CSV.
 *
 * Pure and framework-independent: takes the file's text and returns every row
 * classified as accepted, flagged (valid but needs review) or rejected
 * (invalid), plus any SPV target conflicts. Nothing is dropped silently.
 */
export function importCommitments(csvText: string): ImportResult {
  let records: CsvRecord[];
  try {
    records = parseCsv(csvText);
  } catch (error) {
    if (error instanceof CsvParseError) {
      return emptyResult([`The file could not be read as CSV. ${error.message}`]);
    }
    throw error;
  }

  if (records.length === 0) {
    return emptyResult([
      `The file is empty. Expected a header row: ${REQUIRED_HEADERS.join(",")}`,
    ]);
  }

  const [headerRecord, ...dataRecords] = records;
  const headers = validateHeaders(headerRecord.fields);
  if (!headers.ok) {
    return emptyResult(headers.errors, dataRecords.length);
  }

  if (dataRecords.length === 0) {
    return emptyResult(["The file has a header row but no data rows."]);
  }

  const rows = dataRecords.map((record) =>
    validateRow(record, headers.columnIndex, headerRecord.fields.length),
  );

  // Separate concern: target conflicts use every row with a valid SPV name and
  // target, regardless of its other errors.
  const spvConflicts = detectSpvTargetConflicts(
    rows.flatMap((row) => (row.spvStatement ? [row.spvStatement] : [])),
  );

  const accepted: Commitment[] = [];
  const flagged: RowIssue[] = [];
  const rejected: RowIssue[] = [];
  // Duplicate key: normalized email + normalized SPV name → first valid line.
  const firstSeen = new Map<string, Commitment>();

  for (const row of rows) {
    if (!row.commitment) {
      rejected.push({
        lineNumber: row.raw.lineNumber,
        status: "rejected",
        raw: row.raw,
        reasons: row.reasons,
      });
      continue;
    }

    const commitment = row.commitment;
    const duplicateKey = `${commitment.investorEmail}|${commitment.spvKey}`;
    const original = firstSeen.get(duplicateKey);

    if (original) {
      // Flag for review rather than merging: summing two rows could silently
      // double-count a single financial commitment.
      flagged.push({
        lineNumber: commitment.lineNumber,
        status: "flagged",
        raw: row.raw,
        relatedLineNumber: original.lineNumber,
        reasons: [
          {
            field: "investor_email",
            message: `Duplicate commitment for ${commitment.investorEmail} in ${original.spvName}; first seen on line ${original.lineNumber}. Flagged for review, not merged or counted.`,
          },
        ],
      });
      continue;
    }

    firstSeen.set(duplicateKey, commitment);
    accepted.push(commitment);
  }

  return {
    fileErrors: [],
    totalRows: dataRecords.length,
    accepted,
    flagged,
    rejected,
    spvConflicts,
  };
}
