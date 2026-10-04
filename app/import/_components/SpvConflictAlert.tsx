import type { SpvTargetConflict } from "@/lib/commitments/types";
import { formatUsd } from "@/lib/format";

interface SpvConflictAlertProps {
  conflict: SpvTargetConflict;
}

export function describeConflictTargets(conflict: SpvTargetConflict): string {
  return conflict.targets
    .map(({ targetUsd, lineNumbers }) =>
      `${formatUsd(targetUsd)} (line${lineNumbers.length > 1 ? "s" : ""} ${lineNumbers.join(", ")})`,
    )
    .join(" vs ");
}

export default function SpvConflictAlert({ conflict }: SpvConflictAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
    >
      <p className="font-semibold">
        SPV target conflict: {conflict.spvName}
      </p>
      <p className="mt-1 text-sm">
        The CSV states different targets for this SPV:{" "}
        <strong>{describeConflictTargets(conflict)}</strong>. No target has been
        chosen, so its percentage funded cannot be calculated until the CSV is
        corrected.
      </p>
    </div>
  );
}
