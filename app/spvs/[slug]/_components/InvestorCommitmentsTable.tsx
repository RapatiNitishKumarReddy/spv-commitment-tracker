import type { SpvSummary } from "@/lib/commitments/types";
import { formatPercent, formatUsd } from "@/lib/format";

export default function InvestorCommitmentsTable({ summary }: { summary: SpvSummary }) {
  // Largest commitments first; ties by investor name.
  const commitments = [...summary.commitments].sort(
    (a, b) => b.commitmentUsd - a.commitmentUsd || a.investorName.localeCompare(b.investorName, "en"),
  );

  return (
    <section aria-labelledby="investor-commitments-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="investor-commitments-heading" className="text-xl font-semibold">
          Investor commitments <span className="text-zinc-500">({commitments.length})</span>
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Accepted commitments that count toward the total, largest first.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Investor</th>
              <th scope="col" className="px-3 py-2 font-medium">Email</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Commitment</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Share of total</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">CSV line</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {commitments.map((commitment) => (
              <tr key={commitment.lineNumber}>
                <th scope="row" className="px-3 py-2 font-medium">{commitment.investorName}</th>
                <td className="px-3 py-2 break-all">{commitment.investorEmail}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatUsd(commitment.commitmentUsd)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatPercent((commitment.commitmentUsd / summary.totalCommittedUsd) * 100)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                  {commitment.lineNumber}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th scope="row" colSpan={2} className="px-3 py-2 font-semibold">Total committed</th>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {formatUsd(summary.totalCommittedUsd)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
