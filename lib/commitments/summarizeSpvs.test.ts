import { describe, expect, it } from "vitest";
import { summarizeSpvs } from "./summarizeSpvs";
import type { Commitment } from "./types";

function commitment(overrides: Partial<Commitment>): Commitment {
  return {
    lineNumber: 2,
    spvName: "Beta Infra SPV",
    spvKey: "beta infra spv",
    spvTargetUsd: 250000,
    investorName: "Investor",
    investorEmail: "investor@example.com",
    commitmentUsd: 0,
    ...overrides,
  };
}

describe("summarizeSpvs", () => {
  it("calculates total committed, percent funded and over-subscription", () => {
    const [beta] = summarizeSpvs(
      [commitment({ commitmentUsd: 150000 }), commitment({ lineNumber: 3, commitmentUsd: 200000 })],
      [],
    );
    expect(beta).toMatchObject({
      targetUsd: 250000,
      totalCommittedUsd: 350000,
      percentFunded: 140,
      isOverSubscribed: true,
      hasTargetConflict: false,
    });
  });

  it("does not warn when exactly 100% funded", () => {
    const [spv] = summarizeSpvs([commitment({ commitmentUsd: 250000 })], []);
    expect(spv.percentFunded).toBe(100);
    expect(spv.isOverSubscribed).toBe(false);
  });

  it("leaves target and percent unresolved for SPVs with a target conflict", () => {
    const gamma = { spvName: "Gamma", spvKey: "gamma" };
    const [spv] = summarizeSpvs(
      [
        commitment({ ...gamma, spvTargetUsd: 300000, commitmentUsd: 100000 }),
        commitment({ ...gamma, spvTargetUsd: 350000, commitmentUsd: 120000, lineNumber: 3 }),
      ],
      [{ spvKey: "gamma", spvName: "Gamma", targets: [] }],
    );
    expect(spv).toMatchObject({
      targetUsd: null,
      percentFunded: null,
      totalCommittedUsd: 220000,
      isOverSubscribed: false,
      hasTargetConflict: true,
    });
  });

  it("groups by SPV in order of first appearance", () => {
    const summaries = summarizeSpvs(
      [
        commitment({ spvName: "Alpha", spvKey: "alpha" }),
        commitment({}),
        commitment({ spvName: "Alpha", spvKey: "alpha" }),
      ],
      [],
    );
    expect(summaries.map((s) => [s.spvName, s.commitments.length])).toEqual([
      ["Alpha", 2],
      ["Beta Infra SPV", 1],
    ]);
  });
});
