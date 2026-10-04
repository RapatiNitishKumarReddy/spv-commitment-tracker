"use client";

import { useState, type ChangeEvent } from "react";
import { REQUIRED_HEADERS } from "@/lib/commitments/headers";
import { importCommitments } from "@/lib/commitments/importCommitments";
import ErrorBanner from "@/app/_components/ErrorBanner";
import { textLinkClass } from "@/app/_components/styles";
import { importStore, useImportedData } from "@/app/_lib/useImportedData";
import { resolveImportView, type ImportFormState } from "../_lib/resolveImportView";
import ImportResults from "./ImportResults";
import ImportStatusBanner from "./ImportStatusBanner";

export default function CsvImportForm() {
  const [formState, setFormState] = useState<ImportFormState>({ status: "idle" });
  // The saved import (read safely after hydration) lets results survive
  // navigating away from and back to this page.
  const saved = useImportedData();
  const view = resolveImportView(formState, saved);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Reset so choosing the same file again re-runs the import.
    input.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFormState({
        status: "error",
        fileName: file.name,
        messages: ["Please choose a .csv file."],
      });
      return;
    }

    setFormState({ status: "parsing", fileName: file.name });
    try {
      const csvText = await file.text();
      const result = importCommitments(csvText);
      if (result.fileErrors.length > 0) {
        // Failed imports never overwrite the previously saved data.
        setFormState({ status: "error", fileName: file.name, messages: result.fileErrors });
        return;
      }

      // Persist the latest successful import for the SPV list and detail pages.
      const importedAt = new Date().toISOString();
      const savedResult = importStore.save({ csvText, fileName: file.name, importedAt });
      setFormState(
        savedResult.ok
          ? { status: "saved", importedAt }
          : { status: "unsaved", fileName: file.name, result, saveError: savedResult.message },
      );
    } catch (error) {
      setFormState({
        status: "error",
        fileName: file.name,
        messages: [
          `Something went wrong while reading the file${error instanceof Error ? `: ${error.message}` : "."}`,
        ],
      });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby="upload-heading"
        className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="upload-heading" className="text-base font-semibold">
              Upload a commitments CSV
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              One row per commitment. A successful import replaces the data currently saved in this browser.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <label htmlFor="commitments-csv" className="text-sm font-medium">
              Choose a commitments CSV file
            </label>
            <input
              id="commitments-csv"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={view.kind === "parsing"}
              className="block w-full max-w-xs text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-zinc-300"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="shrink-0 text-zinc-600 dark:text-zinc-400">Required header</span>
            <code className="max-w-full overflow-x-auto whitespace-nowrap rounded bg-white px-2 py-0.5 font-mono text-xs text-zinc-800 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-800">
              {REQUIRED_HEADERS.join(",")}
            </code>
          </div>
          <a href="/sample-commitments.csv" download className={`w-fit shrink-0 ${textLinkClass}`}>
            Download sample CSV
          </a>
        </div>
      </section>

      {view.kind === "parsing" && (
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          Parsing {view.fileName}…
        </p>
      )}

      {view.kind === "error" && (
        <ErrorBanner
          title={view.fileName ? `${view.fileName} could not be imported` : "The file could not be imported"}
          messages={view.messages}
        />
      )}

      {view.kind === "unsaved" && (
        <>
          <ErrorBanner
            title="The import could not be saved in this browser"
            messages={[
              view.saveError,
              "The results below are still shown, but the SPV pages will not include this import.",
            ]}
          />
          <ImportResults fileName={view.fileName} result={view.result} />
        </>
      )}

      {view.kind === "results" && (
        <>
          <ImportStatusBanner source={view.source} fileName={view.fileName} importedAt={view.importedAt} />
          <ImportResults fileName={view.fileName} result={view.result} />
        </>
      )}
    </div>
  );
}
