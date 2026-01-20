import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
export function formatCurrency(amount: number | string | null | undefined) {
  const numericAmount = Number(amount) || 0;

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Formats a date string to a readable format
 * Usage: formatDate("2024-01-20") -> "20 Jan 2024"
 */
export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
