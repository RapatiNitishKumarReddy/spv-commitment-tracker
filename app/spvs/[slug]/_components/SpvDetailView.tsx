"use client";

import Link from "next/link";
import { getSpvDetail, type SpvDetail } from "@/lib/commitments/getSpvDetail";
import { formatPercent } from "@/lib/format";
import EmptyState from "@/app/_components/EmptyState";
import ErrorBanner from "@/app/_components/ErrorBanner";
import LoadingState from "@/app/_components/LoadingState";
import NoImportState from "@/app/_components/NoImportState";
import OverSubscriptionAlert from "@/app/_components/OverSubscriptionAlert";
import SpvConflictAlert from "@/app/_components/SpvConflictAlert";
import StatusBadge from "@/app/_components/StatusBadge";
import { primaryButtonClass, textLinkClass } from "@/app/_components/styles";
import { useImportedData } from "@/app/_lib/useImportedData";
import InvestorCommitmentsTable from "./InvestorCommitmentsTable";
import NeedsReviewTable from "./NeedsReviewTable";
import SpvSummaryCards from "./SpvSummaryCards";

function BackLink() {
  return (
    <Link href="/" className={`w-fit text-sm ${textLinkClass}`}>
      <span aria-hidden="true">← </span>All SPVs
    </Link>
  );
}

export default function SpvDetailView({ slug }: { slug: string }) {
  const data = useImportedData();

  if (data.status === "loading") {
    return (
      <>
        <BackLink />
        <LoadingState />
      </>
    );
  }

  if (data.status === "empty") {
    return (
      <>
        <BackLink />
        <NoImportState />
      </>
    );
  }

  if (data.status === "error") {
    return (
      <>
        <BackLink />
        <ErrorBanner title="The saved import could not be read" messages={data.messages} />
      </>
    );
  }

  const detail = getSpvDetail(data.result, slug);
  if (!detail) {
    return (
      <>
        <BackLink />
        <EmptyState
          title="SPV not found"
          description="No SPV in the current import matches this link. It may have been renamed or removed in a newer CSV import."
          action={
            <Link href="/" className={primaryButtonClass}>
              Back to all SPVs
            </Link>
          }
        />
      </>
    );
  }

  return <SpvDetailContent detail={detail} />;
}

function SpvDetailContent({ detail }: { detail: SpvDetail }) {
  const { summary, conflict, issues } = detail;

  return (
    <>
      <header className="flex flex-col gap-3">
        <BackLink />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="break-words text-3xl font-semibold tracking-tight">{summary.spvName}</h1>
          {summary.hasTargetConflict ? (
            <StatusBadge tone="danger">Target conflict</StatusBadge>
          ) : summary.isOverSubscribed && summary.percentFunded !== null ? (
            <StatusBadge tone="warning">Over-subscribed: {formatPercent(summary.percentFunded)} of target</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Within target</StatusBadge>
          )}
        </div>
      </header>

      <SpvSummaryCards summary={summary} conflict={conflict} />

      {conflict && <SpvConflictAlert conflict={conflict} />}
      {summary.isOverSubscribed && <OverSubscriptionAlert summary={summary} />}

      <InvestorCommitmentsTable summary={summary} />

      <NeedsReviewTable issues={issues} />
    </>
  );
}
