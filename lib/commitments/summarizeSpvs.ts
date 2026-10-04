import type { Commitment, SpvSummary, SpvTargetConflict } from "./types";

/**
 * Aggregates accepted commitments per SPV.
 *
 * - SPVs with a target conflict get `targetUsd` and `percentFunded` of `null`;
 *   a target is never picked. Their commitments still count toward the total.
 * - Over-subscribed means total committed is strictly greater than the target.
 * - SPVs appear in the order they first appear in `commitments`.
 */
export function summarizeSpvs(
  commitments: Commitment[],
  spvConflicts: SpvTargetConflict[],
): SpvSummary[] {
  const conflictedKeys = new Set(spvConflicts.map((c) => c.spvKey));
  const groups = new Map<string, Commitment[]>();

  for (const commitment of commitments) {
    const group = groups.get(commitment.spvKey) ?? [];
    group.push(commitment);
    groups.set(commitment.spvKey, group);
  }

  return [...groups].map(([spvKey, group]) => {
    const hasTargetConflict = conflictedKeys.has(spvKey);
    const targetUsd = hasTargetConflict ? null : group[0].spvTargetUsd;
    const totalCommittedUsd =
      Math.round(group.reduce((sum, c) => sum + c.commitmentUsd, 0) * 100) / 100;
    const percentFunded =
      targetUsd === null ? null : (totalCommittedUsd / targetUsd) * 100;

    return {
      spvKey,
      spvName: group[0].spvName,
      targetUsd,
      totalCommittedUsd,
      percentFunded,
      isOverSubscribed: targetUsd !== null && totalCommittedUsd > targetUsd,
      hasTargetConflict,
      commitments: group,
    };
  });
}
