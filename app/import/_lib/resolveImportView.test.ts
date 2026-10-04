import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { importCommitments } from "@/lib/commitments/importCommitments";
import { createImportStore, type StorageLike } from "@/lib/commitments/importStore";
import type { ImportedData } from "@/app/_lib/useImportedData";
import { resolveImportView, type ImportFormState } from "./resolveImportView";

const sampleCsv = readFileSync(
  fileURLToPath(new URL("../../../public/sample-commitments.csv", import.meta.url)),
  "utf8",
);

const stored = {
  csvText: sampleCsv,
  fileName: "sample-commitments.csv",
  importedAt: "2026-10-05T09:00:00.000Z",
};
const ready: ImportedData = { status: "ready", stored, result: importCommitments(sampleCsv) };

describe("resolveImportView", () => {
  it("restores the saved import when the page is opened again", () => {
    const view = resolveImportView({ status: "idle" }, ready);
    expect(view).toMatchObject({
      kind: "results",
      source: "restored",
      fileName: "sample-commitments.csv",
      importedAt: stored.importedAt,
    });
    if (view.kind === "results") {
      // Same results as the original import of the sample CSV.
      expect(view.result.accepted).toHaveLength(6);
      expect(view.result.flagged.map((i) => i.lineNumber)).toEqual([4]);
      expect(view.result.rejected.map((i) => i.lineNumber)).toEqual([5, 7, 9]);
      expect(view.result.spvConflicts).toHaveLength(1);
    }
  });

  it("marks results from an upload made on this visit as just imported", () => {
    const form: ImportFormState = { status: "saved", importedAt: stored.importedAt };
    expect(resolveImportView(form, ready)).toMatchObject({ kind: "results", source: "just-imported" });
  });

  it("treats a newer import from another tab as restored", () => {
    const form: ImportFormState = { status: "saved", importedAt: "2026-10-05T08:00:00.000Z" };
    expect(resolveImportView(form, ready)).toMatchObject({ kind: "results", source: "restored" });
  });

  it("shows the empty state while loading, with no saved data, or with unreadable data", () => {
    const unreadable: ImportedData = { status: "error", stored, messages: ["The file is empty."] };
    for (const saved of [{ status: "loading" }, { status: "empty" }, unreadable] as ImportedData[]) {
      expect(resolveImportView({ status: "idle" }, saved)).toEqual({ kind: "empty" });
    }
  });

  it("clears restored results as soon as the saved import is cleared", () => {
    const form: ImportFormState = { status: "saved", importedAt: stored.importedAt };
    expect(resolveImportView(form, { status: "empty" })).toEqual({ kind: "empty" });
  });

  it("lets in-progress work take precedence over the saved import", () => {
    expect(resolveImportView({ status: "parsing", fileName: "new.csv" }, ready)).toEqual({
      kind: "parsing",
      fileName: "new.csv",
    });
    expect(resolveImportView({ status: "error", fileName: "bad.csv", messages: ["x"] }, ready)).toMatchObject({
      kind: "error",
    });
    const unsaved: ImportFormState = {
      status: "unsaved",
      fileName: "new.csv",
      result: ready.status === "ready" ? ready.result : importCommitments(""),
      saveError: "Could not save the import: QuotaExceededError",
    };
    expect(resolveImportView(unsaved, { status: "empty" })).toMatchObject({ kind: "unsaved", fileName: "new.csv" });
  });
});

describe("save → reopen round trip through the import store", () => {
  it("restores exactly what was saved, and nothing after clearing", () => {
    const data = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => void data.set(key, value),
      removeItem: (key) => void data.delete(key),
    };

    // First visit: import and save.
    createImportStore(() => storage).save(stored);

    // Second visit: a fresh store (as after navigation) reads it back.
    const reopened = createImportStore(() => storage);
    const restored = reopened.read();
    expect(restored).toEqual(stored);
    const saved: ImportedData = { status: "ready", stored: restored!, result: importCommitments(restored!.csvText) };
    expect(resolveImportView({ status: "idle" }, saved)).toMatchObject({ kind: "results", source: "restored" });

    reopened.clear();
    expect(reopened.read()).toBeNull();
  });
});
