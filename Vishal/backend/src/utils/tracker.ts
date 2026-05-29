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
