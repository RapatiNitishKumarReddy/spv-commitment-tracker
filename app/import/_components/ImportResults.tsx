import { summarizeSpvs } from "@/lib/commitments/summarizeSpvs";
import type { ImportResult } from "@/lib/commitments/types";
import AcceptedRowsTable from "./AcceptedRowsTable";
import ImportSummary from "./ImportSummary";
import OverSubscriptionAlert from "@/app/_components/OverSubscriptionAlert";
import RowIssuesTable from "./RowIssuesTable";
import SpvConflictAlert from "@/app/_components/SpvConflictAlert";
import SpvSummaryTable from "@/app/_components/SpvSummaryTable";

interface ImportResultsProps {
  fileName: string;
  result: ImportResult;
}

export default function ImportResults({ fileName, result }: ImportResultsProps) {
  const summaries = summarizeSpvs(result.accepted, result.spvConflicts);
  const conflictedSpvKeys = new Set(result.spvConflicts.map((c) => c.spvKey));

  return (
    <div className="flex flex-col gap-8">
      <ImportSummary fileName={fileName} result={result} />

      {result.spvConflicts.map((conflict) => (
        <SpvConflictAlert key={conflict.spvKey} conflict={conflict} />
      ))}

      {summaries
        .filter((summary) => summary.isOverSubscribed)
        .map((summary) => (
          <OverSubscriptionAlert key={summary.spvKey} summary={summary} />
        ))}

      <SpvSummaryTable summaries={summaries} conflicts={result.spvConflicts} />

      <RowIssuesTable
        title="Rejected rows"
        description="These rows contain invalid data and were not imported."
        emptyMessage="No rows were rejected."
        tone="rejected"
        issues={result.rejected}
      />

      <RowIssuesTable
        title="Flagged for review"
        description="These rows are valid but need a human decision. They are not counted in any totals."
        emptyMessage="No rows were flagged."
        tone="flagged"
        issues={result.flagged}
      />

      <AcceptedRowsTable
        commitments={result.accepted}
        conflictedSpvKeys={conflictedSpvKeys}
      />
    </div>
  );
}
