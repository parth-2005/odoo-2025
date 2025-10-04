import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Basic input sanitation helpers (client-side defensive trimming/whitelisting)
const DANGEROUS_PATTERN = /[<>\u202E\u202D]/g; // strip angle brackets and unicode override chars

export function sanitizeText(input: string, { max = 500 }: { max?: number } = {}) {
  if (!input) return "";
  const trimmed = input.trim().slice(0, max);
  return trimmed.replace(DANGEROUS_PATTERN, "");
}

export function sanitizeNumber(input: string) {
  // allow digits, dot, minus
  const cleaned = input.replace(/[^0-9.-]/g, "");
  return cleaned;
}

