import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export interface AIInsightResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
}

const SYSTEM_PROMPT = `You are a financial advisor AI assistant. Analyze spending data and provide:
1. A brief summary of spending patterns (2-3 sentences)
2. Key insights as a JSON array of strings (3-5 items)
3. Actionable money-saving recommendations as a JSON array of strings (3-5 items)

Respond ONLY with valid JSON in this exact shape:
{
  "summary": "Brief summary here",
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

function extractTextFromCohereResponse(data: {
  message?: { content?: Array<{ type?: string; text?: string }> };
}): string {
  const parts = data.message?.content ?? [];
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("");
}

function parseAiJson(text: string): AIInsightResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      summary: text.slice(0, 500) || "Analysis complete.",
      insights: ["Review your spending patterns regularly"],
      recommendations: ["Track expenses daily for better visibility"],
    };
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<AIInsightResponse>;
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "Spending analysis",
    insights: Array.isArray(parsed.insights)
      ? parsed.insights.filter((i): i is string => typeof i === "string")
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((r): r is string => typeof r === "string")
      : [],
  };
}

export function isCohereConfigured(): boolean {
  return Boolean(env.COHERE_API_KEY?.trim());
}

export async function generateFinancialInsight(userPrompt: string): Promise<AIInsightResponse> {
  const apiKey = env.COHERE_API_KEY?.trim();
  if (!apiKey) {
    throw new ApiError(
      503,
      "AI_NOT_CONFIGURED",
      "Cohere API key is not configured. Set COHERE_API_KEY in backend .env"
    );
  }

  const model = env.COHERE_MODEL;

  const response = await fetch("https://api.cohere.com/v2/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new ApiError(
      502,
      "AI_PROVIDER_ERROR",
      `Cohere API error (${response.status}): ${errBody.slice(0, 200) || response.statusText}`
    );
  }

  const data = (await response.json()) as Parameters<typeof extractTextFromCohereResponse>[0];
  const text = extractTextFromCohereResponse(data);

  if (!text.trim()) {
    throw new ApiError(502, "AI_EMPTY_RESPONSE", "Cohere returned an empty response");
  }

  try {
    return parseAiJson(text);
  } catch {
    return {
      summary: text.slice(0, 500),
      insights: [],
      recommendations: [],
    };
  }
}

export function formatAiAnalysisForEmail(ai: AIInsightResponse): string {
  let text = ai.summary;
  if (ai.insights.length > 0) {
    text += "\n\nKey insights:\n" + ai.insights.map((i) => `• ${i}`).join("\n");
  }
  if (ai.recommendations.length > 0) {
    text += "\n\nRecommendations:\n" + ai.recommendations.map((r) => `• ${r}`).join("\n");
  }
  return text.trim();
}
