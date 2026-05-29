import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import type { AIProviderAdapter } from "./provider.interface.js";
import { parseAIResponse } from "./response.formatter.js";

export class GeminiProvider implements AIProviderAdapter {
  constructor(private apiKey: string) {}

  async generateInsight(systemPrompt: string, userPrompt: string) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    return parseAIResponse(text);
  }
}
