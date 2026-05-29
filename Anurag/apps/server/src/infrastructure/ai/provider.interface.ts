import type { AIInsightResponse } from "./types.js";

export interface AIProviderAdapter {
  generateInsight(systemPrompt: string, userPrompt: string): Promise<AIInsightResponse>;
}
