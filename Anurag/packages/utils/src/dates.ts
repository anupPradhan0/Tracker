/** Calendar month range in UTC (used by server analytics/budget queries). */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

export function getWeekRange(referenceDate = new Date()): { start: Date; end: Date } {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** YYYY-MM-DD in the user's local timezone (not UTC). */
export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM month key in local time. */
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function todayIsoDate(): string {
  return toISODateString(new Date());
}

/** Parse YYYY-MM into local midnight on the 1st (avoids UTC shift from `new Date("YYYY-MM-01")`). */
export function parseMonthKey(monthKey: string): Date {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y!, m! - 1, 1);
}

/**
 * Parse a date-only or ISO datetime string as local calendar date.
 * API expense dates are stored as UTC midnight; formatting via `new Date(iso)` shifts in US timezones.
 */
export function parseIsoDateOnly(value: string): Date {
  const datePart = value.split("T")[0]!;
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

export function formatLocalDate(
  value: string | Date,
  locale = "en-US",
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof value === "string" ? parseIsoDateOnly(value) : value;
  return date.toLocaleDateString(locale, options);
}
