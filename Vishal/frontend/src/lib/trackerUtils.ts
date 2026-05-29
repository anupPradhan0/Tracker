import type { FixedExpense, TrackerDay } from "@/types/tracker";

export const DAY_LABELS = [
  "Day 1 (Mon)",
  "Day 2 (Tue)",
  "Day 3 (Wed)",
  "Day 4 (Thu)",
  "Day 5 (Fri)",
  "Day 6 (Sat)",
  "Day 7 (Sun)",
] as const;

export function getDayLabel(dayIndex: number): string {
  return DAY_LABELS[dayIndex - 1] ?? `Day ${dayIndex}`;
}

export function formatCurrency(amount: number, currency = "₹"): string {
  return `${currency}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateDayTotal(day: TrackerDay): number {
  return day.entries.reduce((sum, e) => sum + e.amount, 0);
}

export function sumFixedExpenses(fixedExpenses: FixedExpense[] = []): number {
  return fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
}

export function getRealMonthlyBudget(
  monthlyBudget: number,
  fixedExpenses: FixedExpense[] = []
): number {
  return Math.max(0, monthlyBudget - sumFixedExpenses(fixedExpenses));
}

export function getWeeklyBudget(
  monthlyBudget: number,
  fixedExpenses: FixedExpense[] = []
): number {
  const realMonthly = getRealMonthlyBudget(monthlyBudget, fixedExpenses);
  return realMonthly > 0 ? realMonthly / 4 : 0;
}

export function getBudgetStatus(
  pageTotal: number,
  monthlyBudget: number,
  fixedExpenses: FixedExpense[] = []
): {
  weeklyBudget: number;
  fixedExpensesTotal: number;
  availableMonthly: number;
  isOverBudget: boolean;
  label: string;
} {
  const fixedExpensesTotal = sumFixedExpenses(fixedExpenses);
  const availableMonthly = getRealMonthlyBudget(monthlyBudget, fixedExpenses);
  const weeklyBudget = getWeeklyBudget(monthlyBudget, fixedExpenses);
  const isOverBudget = weeklyBudget > 0 && pageTotal > weeklyBudget;
  const label =
    monthlyBudget <= 0
      ? "Ready"
      : isOverBudget
        ? "Over budget"
        : "On track";

  return { weeklyBudget, fixedExpensesTotal, availableMonthly, isOverBudget, label };
}

export const ENTRY_CATEGORIES = [
  "Food",
  "Travel",
  "Groceries",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Bills",
  "Rent",
  "Subscription",
  "Education",
  "Other",
] as const;

export const QUICK_TAGS = [
  "essential",
  "daily",
  "weekly",
  "monthly",
  "urgent",
  "optional",
] as const;

export function parseTagsInput(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function emptyEntryForm() {
  return {
    title: "",
    amount: "",
    description: "",
    category: "",
    tags: "",
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
