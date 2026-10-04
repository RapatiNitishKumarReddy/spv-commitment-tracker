import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getSpvDetail } from "./getSpvDetail";
import { importCommitments } from "./importCommitments";
import { sortSpvsByPercentFunded } from "./sortSpvs";
import { assignSpvSlugs } from "./spvSlug";
import { summarizeSpvs } from "./summarizeSpvs";

// The exact sample file from the assignment, also served to users at /sample-commitments.csv.
const sampleCsv = readFileSync(
  fileURLToPath(new URL("../../public/sample-commitments.csv", import.meta.url)),
  "utf8",
);

describe("end-to-end import of the assignment sample CSV", () => {
  const result = importCommitments(sampleCsv);
  const summaries = summarizeSpvs(result.accepted, result.spvConflicts);
  const summaryFor = (name: string) => summaries.find((s) => s.spvName === name);
  const issueOn = (line: number) =>
    [...result.rejected, ...result.flagged].find((issue) => issue.lineNumber === line);

  it("classifies all 10 rows: 6 accepted, 1 flagged, 3 rejected", () => {
    expect(result.fileErrors).toEqual([]);
    expect(result.totalRows).toBe(10);
    expect(result.accepted.map((c) => [c.lineNumber, c.commitmentUsd])).toEqual([
      [2, 50000],
      [3, 75000],
      [6, 150000],
      [8, 200000],
      [10, 100000],
      [11, 120000],
    ]);
    expect(result.flagged.map((i) => i.lineNumber)).toEqual([4]);
    expect(result.rejected.map((i) => i.lineNumber)).toEqual([5, 7, 9]);
  });

  it("flags Riya's second Alpha commitment as a duplicate of line 2", () => {
    const issue = issueOn(4);
    expect(issue).toMatchObject({ status: "flagged", relatedLineNumber: 2 });
    expect(issue?.reasons[0].message).toMatch(/riya@example\.com.*first seen on line 2/);
  });

  it("rejects the invalid email, negative and blank commitments with clear reasons", () => {
    expect(issueOn(5)?.reasons).toEqual([
      { field: "investor_email", message: "Investor email 'karan@example' is not a valid email address" },
    ]);
    expect(issueOn(7)?.reasons).toEqual([
      { field: "commitment", message: "Commitment cannot be negative ('-10000')" },
    ]);
    expect(issueOn(9)?.reasons).toEqual([
      { field: "commitment", message: "Commitment is missing" },
    ]);
  });

  it("summarizes Alpha Growth SPV I at 25% funded", () => {
    expect(summaryFor("Alpha Growth SPV I")).toMatchObject({
      targetUsd: 500000,
      totalCommittedUsd: 125000,
      percentFunded: 25,
      isOverSubscribed: false,
    });
  });

  it("marks Beta Infra SPV as over-subscribed at 140%", () => {
    expect(summaryFor("Beta Infra SPV")).toMatchObject({
      targetUsd: 250000,
      totalCommittedUsd: 350000,
      percentFunded: 140,
      isOverSubscribed: true,
    });
  });

  it("flags the Gamma Health SPV target conflict without picking a target", () => {
    expect(result.spvConflicts).toEqual([
      {
        spvKey: "gamma health spv",
        spvName: "Gamma Health SPV",
        targets: [
          { targetUsd: 300000, lineNumbers: [10] },
          { targetUsd: 350000, lineNumbers: [11] },
        ],
      },
    ]);
    expect(summaryFor("Gamma Health SPV")).toMatchObject({
      targetUsd: null,
      percentFunded: null,
      totalCommittedUsd: 220000,
      hasTargetConflict: true,
      isOverSubscribed: false,
    });
  });
});

describe("SPV list and detail views for the assignment sample CSV", () => {
  const result = importCommitments(sampleCsv);
  const summaries = summarizeSpvs(result.accepted, result.spvConflicts);

  it("sorts the SPV list by percent funded: Beta (140%), Alpha (25%), then Gamma (conflict)", () => {
    expect(
      sortSpvsByPercentFunded(summaries).map((s) => [s.spvName, s.percentFunded]),
    ).toEqual([
      ["Beta Infra SPV", 140],
      ["Alpha Growth SPV I", 25],
      ["Gamma Health SPV", null],
    ]);
  });

  it("assigns readable detail-page slugs", () => {
    expect([...assignSpvSlugs(summaries.map((s) => s.spvKey)).values()]).toEqual([
      "alpha-growth-spv-i",
      "beta-infra-spv",
      "gamma-health-spv",
    ]);
  });

  it("shows Beta Infra's investors, total and over-subscription on its detail page", () => {
    const detail = getSpvDetail(result, "beta-infra-spv");
    expect(detail?.summary.commitments.map((c) => [c.investorName, c.commitmentUsd])).toEqual([
      ["Neha Rao", 150000],
      ["Sara Khan", 200000],
    ]);
    expect(detail?.summary).toMatchObject({ totalCommittedUsd: 350000, percentFunded: 140, isOverSubscribed: true });
    expect(detail?.issues.map((i) => [i.lineNumber, i.status])).toEqual([
      [7, "rejected"],
      [9, "rejected"],
    ]);
  });

  it("lists Alpha's accepted investors and its rows needing review", () => {
    const detail = getSpvDetail(result, "alpha-growth-spv-i");
    expect(detail?.summary.commitments.map((c) => c.investorEmail)).toEqual([
      "riya@example.com",
      "arjun@example.com",
    ]);
    expect(detail?.issues.map((i) => [i.lineNumber, i.status])).toEqual([
      [4, "flagged"],
      [5, "rejected"],
    ]);
  });

  it("shows Gamma Health's target conflict on its detail page without picking a target", () => {
    const detail = getSpvDetail(result, "gamma-health-spv");
    expect(detail?.summary).toMatchObject({ targetUsd: null, percentFunded: null, totalCommittedUsd: 220000 });
    expect(detail?.conflict?.targets.map((t) => t.targetUsd)).toEqual([300000, 350000]);
    expect(detail?.issues).toEqual([]);
  });
});
