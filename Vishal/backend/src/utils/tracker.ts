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

export function calculatePageTotal(
  days: Array<{ entries: Array<{ amount: number }> }>
): number {
  return days.reduce(
    (total, day) =>
      total + day.entries.reduce((dayTotal, entry) => dayTotal + entry.amount, 0),
    0
  );
}

export function createEmptyDaysPayload() {
  return Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i + 1,
    entries: [] as never[],
  }));
}

export interface FixedExpenseDto {
  title: string;
  amount: number;
}

export function parseFixedExpenses(value: unknown): FixedExpenseDto[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { title: string; amount: number } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { title?: unknown }).title === "string" &&
        typeof (item as { amount?: unknown }).amount === "number" &&
        Number.isFinite((item as { amount: number }).amount)
    )
    .map((item) => ({
      title: item.title.trim(),
      amount: Math.max(0, item.amount),
    }))
    .filter((item) => item.title.length > 0);
}

export function sumFixedExpenses(fixedExpenses: FixedExpenseDto[]): number {
  return fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
}

export function getRealMonthlyBudget(
  monthlyBudget: number,
  fixedExpenses: FixedExpenseDto[]
): number {
  return Math.max(0, monthlyBudget - sumFixedExpenses(fixedExpenses));
}

export function getWeeklyBudget(
  monthlyBudget: number,
  fixedExpenses: FixedExpenseDto[]
): number {
  const realMonthly = getRealMonthlyBudget(monthlyBudget, fixedExpenses);
  return realMonthly > 0 ? realMonthly / 4 : 0;
}
