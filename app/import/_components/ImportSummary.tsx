import type { ImportResult } from "@/lib/commitments/types";

interface ImportSummaryProps {
  fileName: string;
  result: ImportResult;
}

export default function ImportSummary({ fileName, result }: ImportSummaryProps) {
  const counts = [
    { label: "Rows in file", value: result.totalRows, className: "" },
    { label: "Accepted", value: result.accepted.length, className: "text-green-700 dark:text-green-400" },
    { label: "Flagged for review", value: result.flagged.length, className: "text-amber-700 dark:text-amber-400" },
    { label: "Rejected", value: result.rejected.length, className: "text-red-700 dark:text-red-400" },
    { label: "SPV target conflicts", value: result.spvConflicts.length, className: "text-red-700 dark:text-red-400" },
  ];

  return (
    <section aria-labelledby="import-summary-heading" className="flex flex-col gap-3">
      <h2 id="import-summary-heading" className="text-xl font-semibold">
        Import results for <span className="break-all font-mono text-base">{fileName}</span>
      </h2>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map(({ label, value, className }) => (
          <div key={label} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
            <dd className={`text-2xl font-semibold ${className}`}>{value}</dd>
          </div>
        ))}
      </dl>

      {result.accepted.length === 0 && (
        <p role="alert" className="font-medium text-red-700 dark:text-red-400">
          No rows were accepted. Review the rejected and flagged rows below, correct the CSV and import it again.
        </p>
      )}
    </section>
  );
}
