import Link from "next/link";
import EmptyState from "./EmptyState";
import { primaryButtonClass } from "./styles";

/** Shown when no CSV has been imported in this browser yet. */
export default function NoImportState() {
  return (
    <EmptyState
      title="No commitments imported yet"
      description="Import a commitments CSV to see each SPV's target, total committed and funding progress."
      action={
        <Link href="/import" className={primaryButtonClass}>
          Import a CSV
        </Link>
      }
    />
  );
}
