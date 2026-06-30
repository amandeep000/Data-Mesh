import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number with locale-aware grouping. */
export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);
}

/** Compact number formatting (e.g. 12.4k, 1.2M). */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

/** Format an ISO date string into a human-readable date. */
export function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };
  return new Intl.DateTimeFormat('en-US', opts).format(date);
}

/** Relative time ("3h ago"). */
export function formatRelative(iso: string | null): string {
  if (!iso) return 'never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'never';
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
  ];
  let duration = abs / 1000;
  for (const division of divisions) {
    if (duration < division.amount) {
      return rtf.format(Math.sign(diff) * Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return 'never';
}

/** Truncate text with an ellipsis. */
export function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

/** Mask a secret, revealing only the last `visible` characters. */
export function maskSecret(secret: string, visible = 4): string {
  if (secret.length <= visible) return secret;
  return `${'•'.repeat(12)}${secret.slice(-visible)}`;
}

/** Sleep helper for mock latency. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
