/** Column names exactly as they appear in the commitments CSV header. */
export type CommitmentCsvField =
  | "spv_name"
  | "spv_target_usd"
  | "investor_name"
  | "investor_email"
  | "commitment";

/** One CSV data row, values trimmed but otherwise untouched. */
export type RawCommitmentRow = {
  /** 1-based line number in the source file (the header is line 1). */
  lineNumber: number;
} & Record<CommitmentCsvField, string>;

/** A fully validated, normalized commitment. All amounts are in USD. */
export interface Commitment {
  lineNumber: number;
  /** Trimmed SPV name, original casing kept for display. */
  spvName: string;
  /** Trimmed, lowercased, inner whitespace collapsed. Used for grouping. */
  spvKey: string;
  spvTargetUsd: number;
  investorName: string;
  /** Trimmed and lowercased. */
  investorEmail: string;
  commitmentUsd: number;
}

export interface RowIssueReason {
  field: CommitmentCsvField | "row";
  message: string;
}

export interface RowIssue {
  lineNumber: number;
  /** `rejected` = invalid data; `flagged` = valid data that needs human review. */
  status: "rejected" | "flagged";
  raw: RawCommitmentRow;
  reasons: RowIssueReason[];
  /** Related line, e.g. the first occurrence of a duplicate commitment. */
  relatedLineNumber?: number;
}

export interface SpvTargetConflict {
  spvKey: string;
  spvName: string;
  /** Every distinct target stated for this SPV and the lines that state it. */
  targets: { targetUsd: number; lineNumbers: number[] }[];
}

export interface ImportResult {
  /** Fatal problems (e.g. missing headers). When present, no rows are processed. */
  fileErrors: string[];
  /** Number of non-blank data rows read from the file. */
  totalRows: number;
  accepted: Commitment[];
  flagged: RowIssue[];
  rejected: RowIssue[];
  spvConflicts: SpvTargetConflict[];
}

export interface SpvSummary {
  spvKey: string;
  spvName: string;
  /** `null` when the CSV states conflicting targets — no target is picked. */
  targetUsd: number | null;
  totalCommittedUsd: number;
  /** `null` when the target is unresolved. */
  percentFunded: number | null;
  /** True when total committed is strictly greater than the target. */
  isOverSubscribed: boolean;
  hasTargetConflict: boolean;
  commitments: Commitment[];
}
