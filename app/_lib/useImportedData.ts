"use client";

import { useMemo, useSyncExternalStore } from "react";
import { importCommitments } from "@/lib/commitments/importCommitments";
import {
  IMPORT_STORAGE_KEY,
  createImportStore,
  type StoredImport,
} from "@/lib/commitments/importStore";
import type { ImportResult } from "@/lib/commitments/types";

/** Browser-backed store for the most recent successful import. */
export const importStore = createImportStore(() =>
  typeof window === "undefined" ? null : window.localStorage,
);

function subscribe(listener: () => void) {
  const unsubscribe = importStore.subscribe(listener);
  // Keep pages in sync when another tab imports or clears data.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === IMPORT_STORAGE_KEY) {
      importStore.notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    unsubscribe();
    window.removeEventListener("storage", onStorage);
  };
}

// `undefined` means "not read yet" (server render and hydration).
const getServerSnapshot = (): StoredImport | null | undefined => undefined;

export type ImportedData =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; stored: StoredImport; messages: string[] }
  | { status: "ready"; stored: StoredImport; result: ImportResult };

/**
 * Reads the stored import and re-validates it with the same `importCommitments`
 * used by the import page.
 */
export function useImportedData(): ImportedData {
  const stored = useSyncExternalStore(subscribe, importStore.read, getServerSnapshot);
  const result = useMemo(
    () => (stored ? importCommitments(stored.csvText) : null),
    [stored],
  );

  if (stored === undefined) return { status: "loading" };
  if (stored === null || result === null) return { status: "empty" };
  if (result.fileErrors.length > 0) {
    return { status: "error", stored, messages: result.fileErrors };
  }
  return { status: "ready", stored, result };
}
