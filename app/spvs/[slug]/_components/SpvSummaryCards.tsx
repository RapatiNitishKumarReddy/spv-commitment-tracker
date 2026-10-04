import type { ReactNode } from "react";
import type { SpvSummary, SpvTargetConflict } from "@/lib/commitments/types";
import { formatPercent, formatUsd } from "@/lib/format";
import { describeConflictTargets } from "@/app/_components/SpvConflictAlert";

interface SpvSummaryCardsProps {
  summary: SpvSummary;
  conflict: SpvTargetConflict | null;
}

export default function SpvSummaryCards({ summary, conflict }: SpvSummaryCardsProps) {
  const investorCount = summary.commitments.length;

  return (
    <section aria-label="SPV summary" className="flex flex-col gap-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Target">
          {summary.targetUsd === null ? (
            <>
              <span className="text-red-700 dark:text-red-400">Unresolved</span>
              {conflict && (
                <span className="mt-1 block text-sm font-normal text-zinc-600 dark:text-zinc-400">
                  {describeConflictTargets(conflict)}
                </span>
              )}
            </>
          ) : (
            formatUsd(summary.targetUsd)
          )}
        </SummaryCard>
        <SummaryCard label="Total committed">{formatUsd(summary.totalCommittedUsd)}</SummaryCard>
        <SummaryCard label="Funded">
          {summary.percentFunded === null ? (
            <>
              —
              <span className="mt-1 block text-sm font-normal text-zinc-600 dark:text-zinc-400">
                Needs a single target
              </span>
            </>
          ) : (
            formatPercent(summary.percentFunded)
          )}
        </SummaryCard>
        <SummaryCard label="Investors">{investorCount}</SummaryCard>
      </dl>

      {summary.percentFunded !== null && (
        <div aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full ${summary.isOverSubscribed ? "bg-amber-500" : "bg-zinc-900 dark:bg-zinc-100"}`}
            style={{ width: `${Math.min(summary.percentFunded, 100)}%` }}
          />
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{children}</dd>
    </div>
  );
}
