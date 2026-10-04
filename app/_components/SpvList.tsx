"use client";

import Link from "next/link";
import { sortSpvsByPercentFunded } from "@/lib/commitments/sortSpvs";
import { assignSpvSlugs } from "@/lib/commitments/spvSlug";
import { summarizeSpvs } from "@/lib/commitments/summarizeSpvs";
import type { ImportResult } from "@/lib/commitments/types";
import { useImportedData } from "@/app/_lib/useImportedData";
import EmptyState from "./EmptyState";
import ErrorBanner from "./ErrorBanner";
import ImportSourceBar from "./ImportSourceBar";
import LoadingState from "./LoadingState";
import NoImportState from "./NoImportState";
import SpvSummaryTable from "./SpvSummaryTable";
import { primaryButtonClass, textLinkClass } from "./styles";

export default function SpvList() {
  const data = useImportedData();

  if (data.status === "loading") return <LoadingState />;
  if (data.status === "empty") return <NoImportState />;
  if (data.status === "error") {
    return (
      <div className="flex flex-col gap-4">
        <ErrorBanner title="The saved import could not be read" messages={data.messages} />
        <Link href="/import" className={`w-fit ${primaryButtonClass}`}>
          Import a CSV
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ImportSourceBar stored={data.stored} />
      <SpvOverview result={data.result} />
    </div>
  );
}

function SpvOverview({ result }: { result: ImportResult }) {
  const summaries = summarizeSpvs(result.accepted, result.spvConflicts);

  if (summaries.length === 0) {
    return (
      <EmptyState
        title="No accepted commitments"
        description="Every row in the last import was rejected or flagged for review, so there are no SPV totals to show. Fix the CSV and import it again."
        action={
          <Link href="/import" className={primaryButtonClass}>
            Import a CSV
          </Link>
        }
      />
    );
  }

  // Slugs are assigned in CSV order so URLs stay stable regardless of sorting.
  const slugByKey = assignSpvSlugs(summaries.map((s) => s.spvKey));
  const reviewCount = result.flagged.length + result.rejected.length;

  return (
    <div className="flex flex-col gap-3">
      <SpvSummaryTable
        title="All SPVs"
        description="Sorted by percentage of target, highest first. SPVs with a target conflict have no percentage and are listed last. Totals include accepted commitments only."
        summaries={sortSpvsByPercentFunded(summaries)}
        conflicts={result.spvConflicts}
        getHref={(summary) => `/spvs/${slugByKey.get(summary.spvKey)}`}
      />
      {reviewCount > 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {reviewCount} row{reviewCount === 1 ? "" : "s"} from this import{" "}
          {reviewCount === 1 ? "needs" : "need"} review and {reviewCount === 1 ? "is" : "are"} excluded from
          the totals. Open an SPV to see its rows, or{" "}
          <Link href="/import" className={textLinkClass}>
            re-import a corrected CSV
          </Link>
          .
        </p>
      )}
    </div>
  );
}
