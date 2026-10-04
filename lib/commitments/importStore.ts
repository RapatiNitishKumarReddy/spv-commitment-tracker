/**
 * Persists the most recent successful CSV import.
 *
 * Only the raw CSV text is stored (plus file name and time). Pages re-run
 * `importCommitments` on it, so stored data is always validated by the current
 * rules and can never drift out of sync with the derived data shape.
 *
 * The storage backend is injected, which keeps this module framework- and
 * browser-independent and unit-testable.
 */

export const IMPORT_STORAGE_KEY = "spv-commitment-tracker:last-import";

export interface StoredImport {
  csvText: string;
  fileName: string;
  /** ISO 8601 timestamp. */
  importedAt: string;
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type StoreWriteResult = { ok: true } | { ok: false; message: string };

export interface ImportStore {
  /** Returns the stored import, or `null` if none, unreadable or malformed. */
  read(): StoredImport | null;
  save(data: StoredImport): StoreWriteResult;
  clear(): StoreWriteResult;
  /** Registers a change listener; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Notifies listeners, e.g. after a change made in another browser tab. */
  notify(): void;
}

function parseStoredImport(raw: string | null): StoredImport | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      typeof (value as StoredImport).csvText === "string" &&
      typeof (value as StoredImport).fileName === "string" &&
      typeof (value as StoredImport).importedAt === "string"
    ) {
      const { csvText, fileName, importedAt } = value as StoredImport;
      return { csvText, fileName, importedAt };
    }
  } catch {
    // Malformed JSON is treated the same as missing data.
  }
  return null;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createImportStore(getStorage: () => StorageLike | null): ImportStore {
  const listeners = new Set<() => void>();
  // Cache by raw string so repeated reads return the same object reference
  // (required for React's useSyncExternalStore).
  let cachedRaw: string | null | undefined;
  let cachedValue: StoredImport | null = null;

  function notify() {
    for (const listener of listeners) listener();
  }

  function write(action: (storage: StorageLike) => void, failure: string): StoreWriteResult {
    try {
      const storage = getStorage();
      if (!storage) return { ok: false, message: `${failure}: browser storage is not available.` };
      action(storage);
    } catch (error) {
      return { ok: false, message: `${failure}: ${describeError(error)}` };
    }
    notify();
    return { ok: true };
  }

  return {
    read() {
      let raw: string | null;
      try {
        raw = getStorage()?.getItem(IMPORT_STORAGE_KEY) ?? null;
      } catch {
        return null;
      }
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedValue = parseStoredImport(raw);
      }
      return cachedValue;
    },

    save(data) {
      return write(
        (storage) => storage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(data)),
        "Could not save the import",
      );
    },

    clear() {
      return write(
        (storage) => storage.removeItem(IMPORT_STORAGE_KEY),
        "Could not clear the imported data",
      );
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    notify,
  };
}
