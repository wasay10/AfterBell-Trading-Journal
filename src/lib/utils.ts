import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

export function formatPnl(value: number): string {
  if (value === 0) return "$0.00";
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return value >= 0 ? `+$${formatted}` : `-$${formatted}`;
}

export function getPnlColor(value: number, breakevenCap = 0): string {
  if (Math.abs(value) <= breakevenCap) return "text-[#64748B]";
  return value > 0 ? "text-[#10B981]" : "text-[#F43F5E]";
}

export function getTradeResult(
  pnl: number,
  breakevenCap = 0
): "WIN" | "LOSS" | "BE" {
  if (Math.abs(pnl) <= breakevenCap) return "BE";
  return pnl > 0 ? "WIN" : "LOSS";
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const PSYCHOLOGY_OPTIONS = [
  "Confident",
  "Neutral",
  "Anxious",
  "Fearful",
  "Euphoric",
  "Frustrated",
  "Revenge",
  "FOMO",
  "Bored",
  "Disciplined",
];

export const DEFAULT_MISTAKES = [
  "Overtrading",
  "Early Exit",
  "No Stop Loss",
  "Revenge Trade",
  "FOMO Entry",
  "Sized Too Big",
  "Missed Entry",
  "Moved Stop",
  "Chased Entry",
  "Ignored Rules",
  "Bad Timing",
  "Over Leveraged",
];

export const DEFAULT_SESSIONS = [
  { name: "Asia", startTime: "19:00", endTime: "02:00" },
  { name: "London", startTime: "02:00", endTime: "05:00" },
  { name: "NY AM", startTime: "09:30", endTime: "12:00" },
  { name: "NY PM", startTime: "12:00", endTime: "16:00" },
];

export const LETTER_GRADES = ["A+", "A", "B", "C", "D", "F"];
