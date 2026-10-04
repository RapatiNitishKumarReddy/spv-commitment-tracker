import { describe, expect, it } from "vitest";
import { sortSpvsByPercentFunded } from "./sortSpvs";
import type { SpvSummary } from "./types";

function spv(spvName: string, percentFunded: number | null): SpvSummary {
  return {
    spvKey: spvName.toLowerCase(),
    spvName,
    targetUsd: percentFunded === null ? null : 100,
    totalCommittedUsd: percentFunded ?? 0,
    percentFunded,
    isOverSubscribed: percentFunded !== null && percentFunded > 100,
    hasTargetConflict: percentFunded === null,
    commitments: [],
  };
}

const names = (summaries: SpvSummary[]) => summaries.map((s) => s.spvName);

describe("sortSpvsByPercentFunded", () => {
  it("sorts by percentage funded, highest first", () => {
    const sorted = sortSpvsByPercentFunded([spv("Alpha", 25), spv("Beta", 140), spv("Delta", 80)]);
    expect(names(sorted)).toEqual(["Beta", "Delta", "Alpha"]);
  });

  it("places SPVs with a target conflict (no percentage) last", () => {
    const sorted = sortSpvsByPercentFunded([spv("Gamma", null), spv("Alpha", 25), spv("Beta", 140)]);
    expect(names(sorted)).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  it("breaks ties by SPV name, including between conflicted SPVs", () => {
    const sorted = sortSpvsByPercentFunded([
      spv("Zeta", 50),
      spv("Eta", 50),
      spv("Omega", null),
      spv("Kappa", null),
    ]);
    expect(names(sorted)).toEqual(["Eta", "Zeta", "Kappa", "Omega"]);
  });

  it("compares unrounded percentages", () => {
    const sorted = sortSpvsByPercentFunded([spv("Lower", 33.33), spv("Higher", 33.34)]);
    expect(names(sorted)).toEqual(["Higher", "Lower"]);
  });

  it("does not mutate the input array", () => {
    const input = [spv("Alpha", 25), spv("Beta", 140)];
    sortSpvsByPercentFunded(input);
    expect(names(input)).toEqual(["Alpha", "Beta"]);
  });
});
