"use client";

import { useState, type ChangeEvent } from "react";
import { importCommitments } from "@/lib/commitments/importCommitments";
import type { ImportResult } from "@/lib/commitments/types";
import ErrorBanner from "./ErrorBanner";
import ImportResults from "./ImportResults";

type ImportState =
  | { status: "idle" }
  | { status: "parsing"; fileName: string }
  | { status: "error"; fileName?: string; messages: string[] }
  | { status: "done"; fileName: string; result: ImportResult };

export default function CsvImportForm() {
  const [state, setState] = useState<ImportState>({ status: "idle" });

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Reset so choosing the same file again re-runs the import.
    input.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setState({
        status: "error",
        fileName: file.name,
        messages: ["Please choose a .csv file."],
      });
      return;
    }

    setState({ status: "parsing", fileName: file.name });
    try {
      const result = importCommitments(await file.text());
      if (result.fileErrors.length > 0) {
        setState({ status: "error", fileName: file.name, messages: result.fileErrors });
      } else {
        setState({ status: "done", fileName: file.name, result });
      }
    } catch (error) {
      setState({
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
      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <label htmlFor="commitments-csv" className="font-medium">
          Choose a commitments CSV file
        </label>
        <input
          id="commitments-csv"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={state.status === "parsing"}
          className="block w-full max-w-md text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-white disabled:opacity-50 dark:file:bg-zinc-100 dark:file:text-zinc-900"
        />
        <a
          href="/sample-commitments.csv"
          download
          className="w-fit text-sm underline underline-offset-2"
        >
          Download sample CSV
        </a>
      </section>

      {state.status === "parsing" && (
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          Parsing {state.fileName}…
        </p>
      )}

      {state.status === "error" && (
        <ErrorBanner
          title={
            state.fileName
              ? `${state.fileName} could not be imported`
              : "The file could not be imported"
          }
          messages={state.messages}
        />
      )}

      {state.status === "done" && (
        <ImportResults fileName={state.fileName} result={state.result} />
      )}
    </div>
  );
}
