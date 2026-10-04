import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppEnv, parseAppEnv } from "./appEnv";

describe("parseAppEnv", () => {
  it("accepts each supported environment", () => {
    expect(parseAppEnv("development")).toEqual({ ok: true, env: "development" });
    expect(parseAppEnv("preview")).toEqual({ ok: true, env: "preview" });
    expect(parseAppEnv("production")).toEqual({ ok: true, env: "production" });
  });

  it("ignores surrounding whitespace and letter case", () => {
    expect(parseAppEnv("  Preview ")).toEqual({ ok: true, env: "preview" });
  });

  it("reports a missing value", () => {
    expect(parseAppEnv(undefined)).toEqual({ ok: false, reason: "missing" });
    expect(parseAppEnv("   ")).toEqual({ ok: false, reason: "missing" });
  });

  it("reports unknown values instead of guessing", () => {
    expect(parseAppEnv("prod")).toEqual({ ok: false, reason: "invalid", value: "prod" });
    expect(parseAppEnv("staging")).toEqual({ ok: false, reason: "invalid", value: "staging" });
  });
});

describe("getAppEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads NEXT_PUBLIC_APP_ENV", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "preview");
    expect(getAppEnv()).toEqual({ ok: true, env: "preview" });
  });

  it("treats an unset variable as missing", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", undefined);
    expect(getAppEnv()).toEqual({ ok: false, reason: "missing" });
  });
});
