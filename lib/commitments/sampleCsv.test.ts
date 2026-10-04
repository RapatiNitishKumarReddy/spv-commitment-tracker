import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { importCommitments } from "./importCommitments";
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
