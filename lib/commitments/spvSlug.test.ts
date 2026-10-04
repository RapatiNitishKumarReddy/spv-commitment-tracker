import { describe, expect, it } from "vitest";
import { assignSpvSlugs, toSpvSlug } from "./spvSlug";

describe("toSpvSlug", () => {
  it("builds readable slugs from SPV keys", () => {
    expect(toSpvSlug("alpha growth spv i")).toBe("alpha-growth-spv-i");
    expect(toSpvSlug("beta infra spv")).toBe("beta-infra-spv");
  });

  it("collapses punctuation and trims separators", () => {
    expect(toSpvSlug("  fund #1 / series a (2026)  ")).toBe("fund-1-series-a-2026");
  });

  it("strips accents", () => {
    expect(toSpvSlug("café crème spv")).toBe("cafe-creme-spv");
  });

  it("falls back to 'spv' when nothing usable remains", () => {
    expect(toSpvSlug("")).toBe("spv");
    expect(toSpvSlug("¥€$")).toBe("spv");
  });
});

describe("assignSpvSlugs", () => {
  it("gives every key a unique slug, suffixing collisions in order", () => {
    const slugs = assignSpvSlugs(["alpha+", "alpha-", "alpha!"]);
    expect([...slugs.values()]).toEqual(["alpha", "alpha-2", "alpha-3"]);
  });

  it("does not reuse a slug that another SPV produces naturally", () => {
    const slugs = assignSpvSlugs(["alpha", "alpha!", "alpha 2"]);
    expect([...slugs.values()]).toEqual(["alpha", "alpha-2", "alpha-2-2"]);
  });

  it("is deterministic and ignores repeated keys", () => {
    const keys = ["beta infra spv", "alpha growth spv i", "beta infra spv"];
    expect(assignSpvSlugs(keys)).toEqual(assignSpvSlugs(keys));
    expect(assignSpvSlugs(keys).size).toBe(2);
  });
});
