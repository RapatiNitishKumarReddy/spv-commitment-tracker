import { getAppEnv, type AppEnv } from "@/lib/appEnv";

const LABELS: Record<Exclude<AppEnv, "production">, { title: string; detail: string }> = {
  preview: {
    title: "Preview deployment",
    detail: "This build is for reviewing a pull request. It is not production.",
  },
  development: {
    title: "Development",
    detail: "Running locally.",
  },
};

/**
 * Thin banner identifying non-production deployments, driven by
 * NEXT_PUBLIC_APP_ENV. Production, or a missing value, renders nothing, so the
 * production UI is unchanged.
 */
export default function EnvironmentBadge() {
  const appEnv = getAppEnv();

  if (!appEnv.ok) {
    if (appEnv.reason === "invalid") {
      console.warn(
        `Ignoring NEXT_PUBLIC_APP_ENV="${appEnv.value}". Expected one of: development, preview, production.`,
      );
    }
    return null;
  }

  if (appEnv.env === "production") return null;

  const { title, detail } = LABELS[appEnv.env];
  return (
    <div className="border-b border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <p className="mx-auto w-full max-w-6xl px-4 py-1.5 text-xs sm:px-6">
        <span className="font-semibold">{title}</span>
        <span className="hidden sm:inline"> · {detail}</span>
      </p>
    </div>
  );
}
