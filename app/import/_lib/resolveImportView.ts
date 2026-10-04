import type { ImportResult } from "@/lib/commitments/types";
import type { ImportedData } from "@/app/_lib/useImportedData";

/** Transient state owned by the import form while it is mounted. */
export type ImportFormState =
  | { status: "idle" }
  | { status: "parsing"; fileName: string }
  | { status: "error"; fileName?: string; messages: string[] }
  /** Imported and saved; results are read back from the saved import. */
  | { status: "saved"; importedAt: string }
  /** Imported but the browser refused to save it; results live only here. */
  | { status: "unsaved"; fileName: string; result: ImportResult; saveError: string };

export type ImportView =
  | { kind: "empty" }
  | { kind: "parsing"; fileName: string }
  | { kind: "error"; fileName?: string; messages: string[] }
  | { kind: "unsaved"; fileName: string; result: ImportResult; saveError: string }
  | {
      kind: "results";
      /** `just-imported` right after an upload; `restored` when reopening the page. */
      source: "just-imported" | "restored";
      fileName: string;
      importedAt: string;
      result: ImportResult;
    };

/**
 * Decides what the import page shows.
 *
 * In-progress work (parsing, a failed upload, an unsaved import) always wins.
 * Otherwise the page shows the saved import, so results survive navigation and
 * disappear as soon as the saved data is cleared. Saved data that is still
 * loading, missing or unreadable falls back to the empty import state.
 */
export function resolveImportView(form: ImportFormState, saved: ImportedData): ImportView {
  switch (form.status) {
    case "parsing":
      return { kind: "parsing", fileName: form.fileName };
    case "error":
      return { kind: "error", fileName: form.fileName, messages: form.messages };
    case "unsaved":
      return { kind: "unsaved", fileName: form.fileName, result: form.result, saveError: form.saveError };
    case "idle":
    case "saved":
      if (saved.status !== "ready") return { kind: "empty" };
      return {
        kind: "results",
        source:
          form.status === "saved" && form.importedAt === saved.stored.importedAt
            ? "just-imported"
            : "restored",
        fileName: saved.stored.fileName,
        importedAt: saved.stored.importedAt,
        result: saved.result,
      };
  }
}
