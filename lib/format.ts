const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

/** 350000 → "$350,000" */
export function formatUsd(value: number): string {
  return usdFormatter.format(value);
}

/** 140 → "140%", 33.333 → "33.3%" */
export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** ISO timestamp → "Oct 4, 2026, 5:14 PM" (local time). Invalid input is returned unchanged. */
export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return Number.isNaN(date.getTime()) ? isoTimestamp : dateTimeFormatter.format(date);
}
