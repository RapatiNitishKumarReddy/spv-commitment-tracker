import type { SpvTargetConflict } from "./types";

/** The SPV facts a single CSV row states, independent of its commitment. */
export interface SpvTargetStatement {
  lineNumber: number;
  spvKey: string;
  spvName: string;
  targetUsd: number;
}

/** Normalizes an SPV name for grouping: trimmed, lowercased, whitespace collapsed. */
export function toSpvKey(spvName: string): string {
  return spvName.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Finds SPVs whose rows state more than one distinct target.
 *
 * This is deliberately separate from commitment validation: callers pass every
 * row with a valid SPV name and target, even when that row's commitment or
 * email is invalid, so an unrelated row error can never hide a target
 * conflict. No target is ever picked — every stated target is reported.
 */
export function detectSpvTargetConflicts(
  statements: SpvTargetStatement[],
): SpvTargetConflict[] {
  const bySpv = new Map<
    string,
    { spvName: string; targets: Map<number, number[]> }
  >();

  for (const { spvKey, spvName, targetUsd, lineNumber } of statements) {
    let group = bySpv.get(spvKey);
    if (!group) {
      group = { spvName, targets: new Map() };
      bySpv.set(spvKey, group);
    }
    const lines = group.targets.get(targetUsd) ?? [];
    lines.push(lineNumber);
    group.targets.set(targetUsd, lines);
  }

  const conflicts: SpvTargetConflict[] = [];
  for (const [spvKey, { spvName, targets }] of bySpv) {
    if (targets.size > 1) {
      conflicts.push({
        spvKey,
        spvName,
        targets: [...targets].map(([targetUsd, lineNumbers]) => ({
          targetUsd,
          lineNumbers,
        })),
      });
    }
  }
  return conflicts;
}
