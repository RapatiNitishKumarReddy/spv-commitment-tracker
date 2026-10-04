import { describe, expect, it } from "vitest";
import { normalizeEmail } from "./normalizeEmail";

describe("normalizeEmail", () => {
  it("trims and lowercases valid emails", () => {
    expect(normalizeEmail("  RIYA@Example.com ")).toEqual({ ok: true, value: "riya@example.com" });
  });

  it("rejects an email without a top-level domain", () => {
    const result = normalizeEmail("karan@example");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("karan@example");
  });

  it("rejects other malformed emails", () => {
    for (const raw of ["no-at-sign.com", "a@@b.com", "a b@c.com", "@example.com", "riya@.com", "riya@example."]) {
      expect(normalizeEmail(raw).ok, raw).toBe(false);
    }
  });

  it("rejects a blank email as missing", () => {
    expect(normalizeEmail("  ")).toEqual({ ok: false, message: "Investor email is missing" });
  });
});
