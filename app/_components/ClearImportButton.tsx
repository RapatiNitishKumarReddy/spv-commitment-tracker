"use client";

import { useState } from "react";
import { importStore } from "@/app/_lib/useImportedData";
import { secondaryButtonClass } from "./styles";

/**
 * Clears the saved import after confirmation. Every page reading the saved
 * import (list, detail, import results) updates immediately via the store.
 */
export default function ClearImportButton() {
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (!window.confirm("Clear the imported data from this browser? You can import a CSV again at any time.")) {
      return;
    }
    const cleared = importStore.clear();
    setError(cleared.ok ? null : cleared.message);
  }

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={handleClear} className={secondaryButtonClass}>
        Clear imported data
      </button>
      {error && (
        <p role="alert" className="max-w-xs text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
