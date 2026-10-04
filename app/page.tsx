import type { Metadata } from "next";
import SpvList from "./_components/SpvList";

export const metadata: Metadata = {
  title: "SPVs | SPV Commitment Tracker",
  description: "Funding progress for each SPV from the most recent commitments import.",
};

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">SPV commitments</h1>
        <p className="max-w-3xl text-zinc-600 dark:text-zinc-400">
          Target, total committed and funding progress for each SPV, based on
          the most recent CSV import in this browser. Select an SPV to see every
          investor&apos;s commitment.
        </p>
      </header>

      <SpvList />
    </main>
  );
}
