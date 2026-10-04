export default function LoadingState({ label = "Loading imported data…" }: { label?: string }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-zinc-200 px-4 py-12 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
    >
      {label}
    </p>
  );
}
