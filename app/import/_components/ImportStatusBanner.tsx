import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import ClearImportButton from "@/app/_components/ClearImportButton";
import { primaryButtonClass } from "@/app/_components/styles";

interface ImportStatusBannerProps {
  source: "just-imported" | "restored";
  fileName: string;
  importedAt: string;
}

const TONES = {
  "just-imported":
    "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
  restored:
    "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
} as const;

/** Confirms a fresh import, or explains that the results shown are the saved last import. */
export default function ImportStatusBanner({ source, fileName, importedAt }: ImportStatusBannerProps) {
  const justImported = source === "just-imported";

  return (
    <div
      role="status"
      className={`flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${TONES[source]}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            justImported
              ? "bg-green-600 text-white dark:bg-green-500 dark:text-green-950"
              : "bg-zinc-300 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
          }`}
        >
          {justImported ? "✓" : "i"}
        </span>
        <p className="min-w-0 text-sm">
          <span className="font-semibold">{justImported ? "Import saved." : "Showing your last import."}</span>{" "}
          {justImported ? "The SPV list now shows the data from " : "Results for "}
          <span className="break-all font-mono font-medium">{fileName}</span>
          {justImported ? "." : `, imported ${formatDateTime(importedAt)}.`}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-start gap-2">
        <Link href="/" className={primaryButtonClass}>
          View SPVs <span aria-hidden="true">→</span>
        </Link>
        <ClearImportButton />
      </div>
    </div>
  );
}
