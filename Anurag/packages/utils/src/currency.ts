export function formatCurrency(
  amount: number | string,
  currency = "INR",
  locale = "en-IN"
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
