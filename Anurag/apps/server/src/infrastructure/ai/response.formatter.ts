import type { AIInsightResponse } from "./types.js";

export function parseAIResponse(raw: string): AIInsightResponse {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as AIInsightResponse;
      return {
        summary: parsed.summary ?? "No summary available.",
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    }
  } catch {
    /* fall through */
  }
  return {
    summary: raw.slice(0, 500),
    insights: [],
    recommendations: [],
  };
}
