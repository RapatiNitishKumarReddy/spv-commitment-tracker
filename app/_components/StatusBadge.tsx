import type { ReactNode } from "react";

const TONE_CLASSES = {
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  danger: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
} as const;

interface StatusBadgeProps {
  tone: keyof typeof TONE_CLASSES;
  children: ReactNode;
}

export default function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
