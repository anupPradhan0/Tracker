export function buildSpendingPrompt(data: {
  period: string;
  totalSpent: string;
  currency: string;
  topCategories: { name: string; total: string }[];
  budgetAmount: string | null;
  budgetExceeded: boolean;
}): string {
  const categories = data.topCategories
    .map((c) => `- ${c.name}: ${c.total} ${data.currency}`)
    .join("\n");

  return `Analyze the following spending data for ${data.period}:

Total spent: ${data.totalSpent} ${data.currency}
Monthly budget: ${data.budgetAmount ?? "Not set"}
Budget exceeded: ${data.budgetExceeded ? "Yes" : "No"}

Top categories:
${categories || "No expenses recorded"}

Provide actionable financial insights.`;
}

export const SYSTEM_PROMPT = `You are a financial advisor AI assistant. Analyze spending data and provide:
1. A brief summary of spending patterns
2. Key insights (as a list)
3. Actionable recommendations to save money (as a list)

Respond in JSON format only:
{
  "summary": "Brief summary here",
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;
