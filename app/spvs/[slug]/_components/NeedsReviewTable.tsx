import type { RowIssue } from "@/lib/commitments/types";
import StatusBadge from "@/app/_components/StatusBadge";

export default function NeedsReviewTable({ issues }: { issues: RowIssue[] }) {
  return (
    <section aria-labelledby="needs-review-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="needs-review-heading" className="text-xl font-semibold">
          Needs review <span className="text-zinc-500">({issues.length})</span>
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Rows for this SPV that were flagged or rejected during import. They are not included in the total.
        </p>
      </div>

      {issues.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No rows for this SPV need review.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">CSV line</th>
                <th scope="col" className="px-3 py-2 font-medium">Status</th>
                <th scope="col" className="px-3 py-2 font-medium">Investor</th>
                <th scope="col" className="px-3 py-2 font-medium">Email</th>
                <th scope="col" className="px-3 py-2 font-medium">Commitment (as entered)</th>
                <th scope="col" className="px-3 py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {issues.map((issue) => (
                <tr key={issue.lineNumber} className="align-top">
                  <td className="px-3 py-2 tabular-nums">{issue.lineNumber}</td>
                  <td className="px-3 py-2">
                    {issue.status === "rejected" ? (
                      <StatusBadge tone="danger">Rejected</StatusBadge>
                    ) : (
                      <StatusBadge tone="warning">Flagged</StatusBadge>
                    )}
                  </td>
                  <td className="px-3 py-2">{issue.raw.investor_name || <Blank />}</td>
                  <td className="px-3 py-2 break-all">{issue.raw.investor_email || <Blank />}</td>
                  <td className="px-3 py-2 font-mono">{issue.raw.commitment || <Blank />}</td>
                  <td className="min-w-64 px-3 py-2">
                    <ul className="flex flex-col gap-1">
                      {issue.reasons.map((reason) => (
                        <li key={`${reason.field}-${reason.message}`}>{reason.message}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Blank() {
  return <span className="italic text-zinc-500">(blank)</span>;
}
