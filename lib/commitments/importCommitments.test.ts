import { describe, expect, it } from "vitest";
import { importCommitments } from "./importCommitments";

const HEADER = "spv_name,spv_target_usd,investor_name,investor_email,commitment";

function csv(...rows: string[]) {
  return [HEADER, ...rows].join("\n");
}

describe("importCommitments — file level", () => {
  it("reports every missing required header and processes no rows", () => {
    const result = importCommitments(
      "spv_name,spv_target,investor_name,investor_email,commitment_amount\nA,1,B,b@x.com,1",
    );
    expect(result.fileErrors).toHaveLength(1);
    expect(result.fileErrors[0]).toContain("spv_target_usd");
    expect(result.fileErrors[0]).toContain("commitment");
    expect(result.accepted).toEqual([]);
    expect(result.rejected).toEqual([]);
  });

  it("matches headers ignoring case, whitespace, order and extra columns", () => {
    const result = importCommitments(
      " Commitment ,SPV_NAME,notes,investor_email,investor_name,spv_target_usd\n100k,Alpha,hi,a@x.com,Ann,500000",
    );
    expect(result.fileErrors).toEqual([]);
    expect(result.accepted[0]).toMatchObject({ spvName: "Alpha", commitmentUsd: 100000 });
  });

  it("rejects duplicated header columns", () => {
    const result = importCommitments(`${HEADER},commitment\n`);
    expect(result.fileErrors[0]).toMatch(/Duplicate column.*commitment/);
  });

  it("reports an empty file and a header-only file", () => {
    expect(importCommitments("").fileErrors[0]).toMatch(/empty/);
    expect(importCommitments(`${HEADER}\n`).fileErrors[0]).toMatch(/no data rows/);
  });

  it("reports malformed CSV quoting as a file error", () => {
    const result = importCommitments(csv('Alpha,500000,Ann,a@x.com,"50,000'));
    expect(result.fileErrors[0]).toMatch(/Line 2: Unterminated/);
  });

  it("handles a BOM and CRLF line endings", () => {
    const result = importCommitments(`﻿${HEADER}\r\nAlpha,500000,Ann,a@x.com,"$50,000"\r\n`);
    expect(result.fileErrors).toEqual([]);
    expect(result.accepted[0].commitmentUsd).toBe(50000);
  });
});

describe("importCommitments — row validation", () => {
  it("collects every error on a row instead of stopping at the first", () => {
    const result = importCommitments(csv(",abc,,not-an-email,-5"));
    const fields = result.rejected[0].reasons.map((r) => r.field);
    expect(fields).toEqual(["spv_name", "spv_target_usd", "investor_name", "investor_email", "commitment"]);
  });

  it("rejects a row with the wrong number of columns", () => {
    const result = importCommitments(csv("Alpha,500000,Ann,a@x.com"));
    expect(result.rejected[0].reasons).toEqual([
      { field: "row", message: "Row has 4 column(s), expected 5" },
    ]);
  });

  it("normalizes accepted values", () => {
    const result = importCommitments(csv("  Alpha  ,$500k, Ann , ANN@X.COM ,1.5L"));
    expect(result.accepted[0]).toEqual({
      lineNumber: 2,
      spvName: "Alpha",
      spvKey: "alpha",
      spvTargetUsd: 500000,
      investorName: "Ann",
      investorEmail: "ann@x.com",
      commitmentUsd: 150000,
    });
  });

  it("rejects zero commitments", () => {
    const result = importCommitments(csv("Alpha,500000,Ann,a@x.com,0"));
    expect(result.rejected[0].reasons[0].message).toBe("Commitment must be greater than zero");
  });
});

describe("importCommitments — duplicates", () => {
  it("flags later rows with the same normalized email and SPV, without merging", () => {
    const result = importCommitments(
      csv(
        "Alpha,500000,Riya,riya@example.com,50000",
        " alpha ,500000,riya shah,  RIYA@example.com ,25000",
      ),
    );
    expect(result.accepted.map((c) => c.lineNumber)).toEqual([2]);
    expect(result.flagged).toHaveLength(1);
    expect(result.flagged[0]).toMatchObject({ lineNumber: 3, status: "flagged", relatedLineNumber: 2 });
    expect(result.flagged[0].reasons[0].message).toMatch(/first seen on line 2/);
  });

  it("does not treat the same investor in different SPVs as a duplicate", () => {
    const result = importCommitments(
      csv("Alpha,500000,Riya,riya@example.com,50000", "Beta,250000,Riya,riya@example.com,50000"),
    );
    expect(result.accepted).toHaveLength(2);
    expect(result.flagged).toEqual([]);
  });

  it("uses the first valid row as the original when an earlier one was rejected", () => {
    const result = importCommitments(
      csv(
        "Alpha,500000,Riya,riya@example.com,-1",
        "Alpha,500000,Riya,riya@example.com,50000",
        "Alpha,500000,Riya,riya@example.com,60000",
      ),
    );
    expect(result.rejected.map((r) => r.lineNumber)).toEqual([2]);
    expect(result.accepted.map((c) => c.lineNumber)).toEqual([3]);
    expect(result.flagged[0].relatedLineNumber).toBe(3);
  });
});

describe("importCommitments — SPV target conflicts", () => {
  it("records every conflicting target with its lines", () => {
    const result = importCommitments(
      csv(
        "Gamma,300000,Ana,ana@example.com,100k",
        "Gamma,350000,Ben,ben@example.com,120000",
        "gamma,300000,Cy,cy@example.com,1000",
      ),
    );
    expect(result.spvConflicts).toEqual([
      {
        spvKey: "gamma",
        spvName: "Gamma",
        targets: [
          { targetUsd: 300000, lineNumbers: [2, 4] },
          { targetUsd: 350000, lineNumbers: [3] },
        ],
      },
    ]);
    // Commitments themselves stay valid.
    expect(result.accepted).toHaveLength(3);
  });

  it("detects a conflict even when the conflicting row has an invalid commitment", () => {
    const result = importCommitments(
      csv("Gamma,300000,Ana,ana@example.com,100k", "Gamma,350000,Ben,ben@example.com,"),
    );
    expect(result.rejected.map((r) => r.lineNumber)).toEqual([3]);
    expect(result.spvConflicts[0].targets).toEqual([
      { targetUsd: 300000, lineNumbers: [2] },
      { targetUsd: 350000, lineNumbers: [3] },
    ]);
  });

  it("ignores rows whose target itself is invalid", () => {
    const result = importCommitments(
      csv("Gamma,300000,Ana,ana@example.com,100k", "Gamma,abc,Ben,ben@example.com,1000"),
    );
    expect(result.spvConflicts).toEqual([]);
  });

  it("treats equal targets written differently as the same target", () => {
    const result = importCommitments(
      csv("Gamma,300000,Ana,ana@example.com,100k", "Gamma,$300k,Ben,ben@example.com,1000"),
    );
    expect(result.spvConflicts).toEqual([]);
  });
});
