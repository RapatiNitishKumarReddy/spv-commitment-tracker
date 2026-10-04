import { describe, expect, it } from "vitest";
import { normalizeAmount } from "./normalizeAmount";

function valueOf(raw: string) {
  const result = normalizeAmount(raw);
  if (!result.ok) throw new Error(`Expected ok for '${raw}', got: ${result.message}`);
  return result.value;
}

function errorCodeOf(raw: string) {
  const result = normalizeAmount(raw);
  if (result.ok) throw new Error(`Expected error for '${raw}', got ${result.value}`);
  return result.code;
}

describe("normalizeAmount", () => {
  it("normalizes currency format $50,000 to 50000", () => {
    expect(valueOf("$50,000")).toBe(50000);
  });

  it("normalizes k notation 100k to 100000", () => {
    expect(valueOf("100k")).toBe(100000);
    expect(valueOf("100K")).toBe(100000);
  });

  it("normalizes L (lakh) notation 1.5L to 150000", () => {
    expect(valueOf("1.5L")).toBe(150000);
    expect(valueOf("1.5l")).toBe(150000);
  });

  it("accepts plain, comma-separated and decimal numbers", () => {
    expect(valueOf("75000")).toBe(75000);
    expect(valueOf("1,250,000")).toBe(1250000);
    expect(valueOf("50000.50")).toBe(50000.5);
    expect(valueOf("  $ 2.5k  ")).toBe(2500);
  });

  it("avoids floating point drift", () => {
    expect(valueOf("1.1L")).toBe(110000);
    expect(valueOf("0.3k")).toBe(300);
  });

  it("rejects negative amounts in every common notation", () => {
    for (const raw of ["-10000", "-$10,000", "$-10,000", "(5000)", "($5,000)", "-1.5L"]) {
      expect(errorCodeOf(raw), raw).toBe("negative");
    }
  });

  it("rejects blank amounts as missing", () => {
    expect(errorCodeOf("")).toBe("missing");
    expect(errorCodeOf("   ")).toBe("missing");
  });

  it("rejects zero", () => {
    expect(errorCodeOf("0")).toBe("zero");
    expect(errorCodeOf("$0.00")).toBe("zero");
  });

  it("rejects invalid or non-numeric values", () => {
    for (const raw of ["abc", "5,0,00", "50,00", "1.2.3k", "k", "$", "10m", "1.5Cr", "+5000", "12 000"]) {
      expect(errorCodeOf(raw), raw).toBe("invalid");
    }
  });

  it("uses the label in error messages", () => {
    const result = normalizeAmount("", "Commitment");
    expect(result).toEqual({ ok: false, code: "missing", message: "Commitment is missing" });
  });
});
