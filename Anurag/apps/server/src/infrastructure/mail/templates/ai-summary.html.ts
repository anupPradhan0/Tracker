import { formatCurrency } from "@anurag/utils";
import { emailLayout } from "./layout.js";
import type { AIInsightResponse } from "../../ai/types.js";

interface ExpenseRow {
  date: string;
  amount: string;
  currency: string;
  description: string | null;
  category?: { name: string };
}

interface ReportStats {
  totalSpent: string;
  currency: string;
  budgetExceeded: boolean;
  budgetAmount: string | null;
  remainingBudget: string | null;
  topCategories: { name: string; total: string; color: string | null }[];
  expenses: ExpenseRow[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildExpenseTable(expenses: ExpenseRow[], currency: string) {
  if (!expenses.length) {
    return `<p class="muted">No expenses recorded for this period.</p>`;
  }

  const rows = expenses
    .map(
      (e) => `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${e.category?.name ?? "—"}</td>
        <td>${e.description?.trim() ? e.description : "—"}</td>
        <td style="text-align:right;font-weight:600;">${formatCurrency(e.amount, e.currency || currency)}</td>
      </tr>`
    )
    .join("");

  return `
    <table class="expense-table" cellpadding="0" cellspacing="0">
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Description</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function buildAiSummaryEmail(
  userName: string,
  period: string,
  insight: AIInsightResponse,
  stats: ReportStats
): string {
  const insightsList = insight.insights.map((i) => `<li>${i}</li>`).join("");
  const recsList = insight.recommendations.map((r) => `<li>${r}</li>`).join("");

  const categoryRows = stats.topCategories.length
    ? stats.topCategories
        .map(
          (c) =>
            `<li><strong>${c.name}</strong>: ${formatCurrency(c.total, stats.currency)}</li>`
        )
        .join("")
    : "<li>No category data</li>";

  const budgetBlock =
    stats.budgetAmount != null
      ? `
    <p><strong>Budget:</strong> ${formatCurrency(stats.budgetAmount, stats.currency)}</p>
    <p><strong>Remaining:</strong> ${
      stats.remainingBudget != null
        ? formatCurrency(stats.remainingBudget, stats.currency)
        : "—"
    }</p>`
      : "";

  const content = `
    <h1>Your ${period} Expense Report</h1>
    <p class="muted">Hi ${userName}, here is your detailed spending report with AI analysis.</p>

    <div class="section">
      <h2>Overview</h2>
      <p><strong>Total spent:</strong> ${formatCurrency(stats.totalSpent, stats.currency)}</p>
      ${budgetBlock}
      ${stats.budgetExceeded ? '<p style="color:#dc2626;"><strong>⚠ Budget exceeded this period</strong></p>' : ""}
    </div>

    <div class="section">
      <h2>Top categories</h2>
      <ul>${categoryRows}</ul>
    </div>

    <div class="section">
      <h2>All expenses (${stats.expenses.length})</h2>
      ${buildExpenseTable(stats.expenses, stats.currency)}
    </div>

    <div class="section">
      <h2>AI summary</h2>
      <p>${insight.summary}</p>
    </div>

    ${insightsList ? `<div class="section"><h2>Insights</h2><ul>${insightsList}</ul></div>` : ""}
    ${recsList ? `<div class="section"><h2>Recommendations</h2><ul>${recsList}</ul></div>` : ""}
  `;

  return emailLayout(content);
}
