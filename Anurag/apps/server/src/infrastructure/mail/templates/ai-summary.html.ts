import { emailLayout } from "./layout.js";
import type { AIInsightResponse } from "../../ai/types.js";

export function buildAiSummaryEmail(
  userName: string,
  period: string,
  insight: AIInsightResponse,
  stats: { totalSpent: string; currency: string; budgetExceeded: boolean }
): string {
  const insightsList = insight.insights.map((i) => `<li>${i}</li>`).join("");
  const recsList = insight.recommendations.map((r) => `<li>${r}</li>`).join("");

  const content = `
    <h1>Your ${period} Financial Summary</h1>
    <p class="muted">Hi ${userName}, here's your AI-generated spending report.</p>

    <div class="section">
      <p><strong>Total spent:</strong> ${stats.totalSpent} ${stats.currency}</p>
      ${stats.budgetExceeded ? '<p style="color:#dc2626;"><strong>⚠ Budget exceeded this period</strong></p>' : ""}
    </div>

    <div class="section">
      <h2>Summary</h2>
      <p>${insight.summary}</p>
    </div>

    ${insightsList ? `<div class="section"><h2>Insights</h2><ul>${insightsList}</ul></div>` : ""}
    ${recsList ? `<div class="section"><h2>Recommendations</h2><ul>${recsList}</ul></div>` : ""}
  `;

  return emailLayout(content);
}
