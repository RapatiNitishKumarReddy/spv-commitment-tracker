/** Deployment environments, configured with NEXT_PUBLIC_APP_ENV. */
export const APP_ENVS = ["development", "preview", "production"] as const;

export type AppEnv = (typeof APP_ENVS)[number];

export type AppEnvResult =
  | { ok: true; env: AppEnv }
  | { ok: false; reason: "missing" }
  | { ok: false; reason: "invalid"; value: string };

/**
 * Validates a NEXT_PUBLIC_APP_ENV value (trimmed, case-insensitive).
 * Unknown values are reported as invalid, never guessed.
 */
export function parseAppEnv(raw: string | undefined): AppEnvResult {
  const value = raw?.trim() ?? "";
  if (value === "") return { ok: false, reason: "missing" };

  const normalized = value.toLowerCase();
  const env = APP_ENVS.find((candidate) => candidate === normalized);
  return env ? { ok: true, env } : { ok: false, reason: "invalid", value };
}

/**
 * Reads NEXT_PUBLIC_APP_ENV. The property must be accessed literally so Next.js
 * can inline it at build time.
 */
export function getAppEnv(): AppEnvResult {
  return parseAppEnv(process.env.NEXT_PUBLIC_APP_ENV);
}
