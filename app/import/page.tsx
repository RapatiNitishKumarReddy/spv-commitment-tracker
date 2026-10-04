import type { Metadata } from "next";
import { REQUIRED_HEADERS } from "@/lib/commitments/headers";
import CsvImportForm from "./_components/CsvImportForm";

export const metadata: Metadata = {
  title: "Import commitments | SPV Commitment Tracker",
  description: "Import and validate investor commitments from a CSV file.",
};

export default function ImportPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Import commitments
        </h1>
        <p className="max-w-3xl text-zinc-600 dark:text-zinc-400">
          Upload a CSV of investor commitments. Every row is validated: valid
          rows are accepted, duplicates are flagged for review, and invalid rows
          are rejected with a reason. Amounts may be written as{" "}
          <code className="font-mono">50000</code>,{" "}
          <code className="font-mono">$50,000</code>,{" "}
          <code className="font-mono">100k</code> or{" "}
          <code className="font-mono">1.5L</code>.
        </p>
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Required header row</span>
          <code className="w-fit max-w-full overflow-x-auto rounded bg-zinc-100 px-2 py-1 font-mono text-xs dark:bg-zinc-900">
            {REQUIRED_HEADERS.join(",")}
          </code>
        </div>
      </header>

      <CsvImportForm />
    </main>
  );
}
