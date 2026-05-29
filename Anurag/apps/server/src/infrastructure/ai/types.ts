export interface AIInsightResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
}

export type AIProviderName = "gemini" | "openai";
