import type { Commitment } from "@/lib/commitments/types";
import { formatUsd } from "@/lib/format";
import StatusBadge from "./StatusBadge";

interface AcceptedRowsTableProps {
  commitments: Commitment[];
  conflictedSpvKeys: Set<string>;
}

export default function AcceptedRowsTable({
  commitments,
  conflictedSpvKeys,
}: AcceptedRowsTableProps) {
  return (
    <section aria-labelledby="accepted-rows-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="accepted-rows-heading" className="text-xl font-semibold">
          Accepted commitments <span className="text-zinc-500">({commitments.length})</span>
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Normalized values. Emails are lowercased and amounts are in USD.
        </p>
      </div>

      {commitments.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No commitments were accepted.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Line</th>
                <th scope="col" className="px-3 py-2 font-medium">SPV</th>
                <th scope="col" className="px-3 py-2 font-medium">Investor</th>
                <th scope="col" className="px-3 py-2 font-medium">Email</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Commitment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {commitments.map((commitment) => (
                <tr key={commitment.lineNumber}>
                  <td className="px-3 py-2 tabular-nums">{commitment.lineNumber}</td>
                  <td className="px-3 py-2">
                    <span className="flex flex-wrap items-center gap-2">
                      {commitment.spvName}
                      {conflictedSpvKeys.has(commitment.spvKey) && (
                        <StatusBadge tone="danger">SPV target conflict</StatusBadge>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2">{commitment.investorName}</td>
                  <td className="px-3 py-2 break-all">{commitment.investorEmail}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatUsd(commitment.commitmentUsd)}
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
