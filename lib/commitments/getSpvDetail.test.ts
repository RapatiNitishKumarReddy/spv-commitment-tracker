import { describe, expect, it } from "vitest";
import { getSpvDetail } from "./getSpvDetail";
import { importCommitments } from "./importCommitments";

const HEADER = "spv_name,spv_target_usd,investor_name,investor_email,commitment";

function csv(...rows: string[]) {
  return [HEADER, ...rows].join("\n");
}

describe("getSpvDetail", () => {
  const result = importCommitments(
    csv(
      "Alpha Fund,500000,Riya,riya@example.com,50000",
      "Beta Fund,250000,Neha,neha@example.com,1.5L",
      "  alpha   FUND ,500000,riya,RIYA@example.com,25000",
      "Alpha Fund,500000,Karan,karan@example,40000",
      "Gamma Fund,300000,Ana,ana@example.com,100k",
      "Gamma Fund,350000,Ben,ben@example.com,120000",
      ",500000,No Spv,nospv@example.com,1000",
    ),
  );

  it("finds an SPV by slug with its summary", () => {
    const detail = getSpvDetail(result, "beta-fund");
    expect(detail?.summary).toMatchObject({ spvName: "Beta Fund", totalCommittedUsd: 150000 });
    expect(detail?.conflict).toBeNull();
    expect(detail?.issues).toEqual([]);
  });

  it("attaches flagged and rejected rows by normalized SPV name, in line order", () => {
    const detail = getSpvDetail(result, "alpha-fund");
    expect(detail?.summary.commitments.map((c) => c.lineNumber)).toEqual([2]);
    expect(detail?.issues.map((i) => [i.lineNumber, i.status])).toEqual([
      [4, "flagged"],
      [5, "rejected"],
    ]);
  });

  it("includes the SPV's target conflict", () => {
    const detail = getSpvDetail(result, "gamma-fund");
    expect(detail?.summary.targetUsd).toBeNull();
    expect(detail?.conflict?.targets.map((t) => t.targetUsd)).toEqual([300000, 350000]);
  });

  it("never attaches rows with a blank SPV name", () => {
    const allIssues = ["alpha-fund", "beta-fund", "gamma-fund"].flatMap(
      (slug) => getSpvDetail(result, slug)?.issues ?? [],
    );
    expect(allIssues.map((i) => i.lineNumber)).not.toContain(8);
  });

  it("returns null for an unknown slug", () => {
    expect(getSpvDetail(result, "does-not-exist")).toBeNull();
  });
});
