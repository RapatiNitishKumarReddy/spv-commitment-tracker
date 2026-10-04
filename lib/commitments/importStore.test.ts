import { describe, expect, it, vi } from "vitest";
import { IMPORT_STORAGE_KEY, createImportStore, type StorageLike } from "./importStore";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const sample = {
  csvText: "spv_name,spv_target_usd,investor_name,investor_email,commitment\n",
  fileName: "sample-commitments.csv",
  importedAt: "2026-10-04T12:00:00.000Z",
};

describe("createImportStore", () => {
  it("saves and reads back an import", () => {
    const storage = memoryStorage();
    const store = createImportStore(() => storage);
    expect(store.read()).toBeNull();
    expect(store.save(sample)).toEqual({ ok: true });
    expect(store.read()).toEqual(sample);
  });

  it("returns the same object for unchanged data", () => {
    const storage = memoryStorage();
    const store = createImportStore(() => storage);
    store.save(sample);
    expect(store.read()).toBe(store.read());
  });

  it("clears stored data", () => {
    const storage = memoryStorage();
    const store = createImportStore(() => storage);
    store.save(sample);
    expect(store.clear()).toEqual({ ok: true });
    expect(store.read()).toBeNull();
  });

  it("ignores malformed or wrongly shaped stored data", () => {
    const storage = memoryStorage();
    const store = createImportStore(() => storage);

    storage.data.set(IMPORT_STORAGE_KEY, "{not json");
    expect(store.read()).toBeNull();

    storage.data.set(IMPORT_STORAGE_KEY, JSON.stringify({ csvText: 42, fileName: "x" }));
    expect(store.read()).toBeNull();

    storage.data.set(IMPORT_STORAGE_KEY, JSON.stringify("just a string"));
    expect(store.read()).toBeNull();
  });

  it("reports write failures instead of throwing", () => {
    const failing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    const store = createImportStore(() => failing);
    expect(store.save(sample)).toEqual({
      ok: false,
      message: "Could not save the import: QuotaExceededError",
    });
    expect(store.clear()).toMatchObject({ ok: false });
  });

  it("treats unreadable or unavailable storage as no data", () => {
    const unreadable = createImportStore(() => {
      throw new Error("SecurityError");
    });
    expect(unreadable.read()).toBeNull();

    const unavailable = createImportStore(() => null);
    expect(unavailable.read()).toBeNull();
    expect(unavailable.save(sample)).toMatchObject({ ok: false });
  });

  it("notifies subscribers after successful writes only", () => {
    const storage = memoryStorage();
    const store = createImportStore(() => storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.save(sample);
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.save(sample);
    expect(listener).toHaveBeenCalledTimes(2);

    const failingStore = createImportStore(() => null);
    const failingListener = vi.fn();
    failingStore.subscribe(failingListener);
    failingStore.save(sample);
    expect(failingListener).not.toHaveBeenCalled();
  });
});
