import type { SpvSummary } from "@/lib/commitments/types";
import { formatPercent, formatUsd } from "@/lib/format";

interface OverSubscriptionAlertProps {
  summary: SpvSummary;
}

export default function OverSubscriptionAlert({ summary }: OverSubscriptionAlertProps) {
  if (summary.targetUsd === null || summary.percentFunded === null) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <p className="font-semibold">
        Over-subscribed: {summary.spvName} is at {formatPercent(summary.percentFunded)} of target
      </p>
      <p className="mt-1 text-sm">
        {formatUsd(summary.totalCommittedUsd)} committed against a target of{" "}
        {formatUsd(summary.targetUsd)} — {formatUsd(summary.totalCommittedUsd - summary.targetUsd)} over.
      </p>
    </div>
  );
}
