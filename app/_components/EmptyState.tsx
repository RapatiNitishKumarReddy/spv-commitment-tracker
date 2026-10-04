import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-300 px-4 py-12 text-center dark:border-zinc-700">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </section>
  );
}
