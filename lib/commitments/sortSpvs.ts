import type { SpvSummary } from "./types";

/**
 * Sorts SPVs by percentage of target funded, highest first.
 *
 * - Uses the unrounded percentage, so 33.34% ranks above 33.33%.
 * - SPVs with a target conflict have no percentage and are placed last.
 * - Ties are broken by SPV name (A–Z) so the order is deterministic.
 * - Returns a new array; the input is not mutated.
 */
export function sortSpvsByPercentFunded(summaries: SpvSummary[]): SpvSummary[] {
  return [...summaries].sort((a, b) => {
    if (a.percentFunded !== b.percentFunded) {
      if (a.percentFunded === null) return 1;
      if (b.percentFunded === null) return -1;
      return b.percentFunded - a.percentFunded;
    }
    return a.spvName.localeCompare(b.spvName, "en");
  });
}
