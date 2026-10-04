import Link from "next/link";
import type { StoredImport } from "@/lib/commitments/importStore";
import { formatDateTime } from "@/lib/format";
import ClearImportButton from "./ClearImportButton";
import { secondaryButtonClass } from "./styles";

/** Shows which file the data came from, with actions to replace or clear it. */
export default function ImportSourceBar({ stored }: { stored: StoredImport }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
      <p className="min-w-0 text-sm text-zinc-700 dark:text-zinc-300">
        Showing data from{" "}
        <span className="break-all font-mono font-medium text-zinc-900 dark:text-zinc-100">{stored.fileName}</span>
        <span className="block text-zinc-600 sm:inline dark:text-zinc-400">
          <span className="hidden sm:inline"> · </span>
          Imported {formatDateTime(stored.importedAt)}
        </span>
      </p>
      <div className="flex flex-wrap items-start gap-2">
        <Link href="/import" className={secondaryButtonClass}>
          Import new CSV
        </Link>
        <ClearImportButton />
      </div>
    </div>
  );
}
