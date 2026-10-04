import type { RowIssue } from "@/lib/commitments/types";

interface RowIssuesTableProps {
  title: string;
  description: string;
  emptyMessage: string;
  tone: "rejected" | "flagged";
  issues: RowIssue[];
}

const REASON_CLASSES = {
  rejected: "text-red-700 dark:text-red-400",
  flagged: "text-amber-700 dark:text-amber-400",
} as const;

export default function RowIssuesTable({
  title,
  description,
  emptyMessage,
  tone,
  issues,
}: RowIssuesTableProps) {
  const headingId = `${tone}-rows-heading`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div>
        <h2 id={headingId} className="text-xl font-semibold">
          {title} <span className="text-zinc-500">({issues.length})</span>
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      {issues.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Line</th>
                <th scope="col" className="px-3 py-2 font-medium">SPV</th>
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
                  <td className="px-3 py-2">{issue.raw.spv_name || <Blank />}</td>
                  <td className="px-3 py-2">{issue.raw.investor_name || <Blank />}</td>
                  <td className="px-3 py-2 break-all">{issue.raw.investor_email || <Blank />}</td>
                  <td className="px-3 py-2 font-mono">{issue.raw.commitment || <Blank />}</td>
                  <td className={`px-3 py-2 ${REASON_CLASSES[tone]}`}>
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
  return <span className="italic text-zinc-400">(blank)</span>;
}
