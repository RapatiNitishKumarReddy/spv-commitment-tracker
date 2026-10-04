import type { SpvSummary, SpvTargetConflict } from "@/lib/commitments/types";
import { formatPercent, formatUsd } from "@/lib/format";
import { describeConflictTargets } from "./SpvConflictAlert";
import StatusBadge from "./StatusBadge";

interface SpvSummaryTableProps {
  summaries: SpvSummary[];
  conflicts: SpvTargetConflict[];
}

export default function SpvSummaryTable({ summaries, conflicts }: SpvSummaryTableProps) {
  const conflictBySpv = new Map(conflicts.map((c) => [c.spvKey, c]));

  return (
    <section aria-labelledby="spv-summary-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="spv-summary-heading" className="text-xl font-semibold">SPV totals</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Totals include accepted rows only. Flagged and rejected rows are excluded.
        </p>
      </div>

      {summaries.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No accepted commitments to total.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">SPV</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Target</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Committed</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">% of target</th>
                <th scope="col" className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {summaries.map((summary) => {
                const conflict = conflictBySpv.get(summary.spvKey);
                return (
                  <tr key={summary.spvKey}>
                    <th scope="row" className="px-3 py-2 font-medium">{summary.spvName}</th>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {summary.targetUsd === null ? (
                        <span className="text-red-700 dark:text-red-400">
                          Unresolved{conflict ? `: ${describeConflictTargets(conflict)}` : ""}
                        </span>
                      ) : (
                        formatUsd(summary.targetUsd)
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatUsd(summary.totalCommittedUsd)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {summary.percentFunded === null ? "—" : formatPercent(summary.percentFunded)}
                    </td>
                    <td className="px-3 py-2">
                      {summary.hasTargetConflict ? (
                        <StatusBadge tone="danger">Target conflict</StatusBadge>
                      ) : summary.isOverSubscribed && summary.percentFunded !== null ? (
                        <StatusBadge tone="warning">
                          Over-subscribed: {formatPercent(summary.percentFunded)} of target
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">Within target</StatusBadge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
