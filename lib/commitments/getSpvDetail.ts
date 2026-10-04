import { toSpvKey } from "./detectSpvTargetConflicts";
import { assignSpvSlugs } from "./spvSlug";
import { summarizeSpvs } from "./summarizeSpvs";
import type { ImportResult, RowIssue, SpvSummary, SpvTargetConflict } from "./types";

export interface SpvDetail {
  slug: string;
  summary: SpvSummary;
  /** Present when the CSV states conflicting targets for this SPV. */
  conflict: SpvTargetConflict | null;
  /** Flagged and rejected rows that name this SPV, ordered by line number. */
  issues: RowIssue[];
}

/**
 * Looks up one SPV by its URL slug.
 *
 * Returns `null` when no SPV with accepted commitments has that slug. Rows that
 * were flagged or rejected are attached by matching their (normalized) SPV
 * name; rows with a blank SPV name cannot be attached to any SPV.
 */
export function getSpvDetail(result: ImportResult, slug: string): SpvDetail | null {
  const summaries = summarizeSpvs(result.accepted, result.spvConflicts);
  const slugByKey = assignSpvSlugs(summaries.map((s) => s.spvKey));
  const summary = summaries.find((s) => slugByKey.get(s.spvKey) === slug);
  if (!summary) return null;

  const issues = [...result.rejected, ...result.flagged]
    .filter(
      (issue) =>
        issue.raw.spv_name.trim() !== "" &&
        toSpvKey(issue.raw.spv_name) === summary.spvKey,
    )
    .sort((a, b) => a.lineNumber - b.lineNumber);

  return {
    slug,
    summary,
    conflict: result.spvConflicts.find((c) => c.spvKey === summary.spvKey) ?? null,
    issues,
  };
}
