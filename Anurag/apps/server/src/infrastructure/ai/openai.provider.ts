import OpenAI from "openai";
import type { AIProviderAdapter } from "./provider.interface.js";
import { parseAIResponse } from "./response.formatter.js";

export class OpenAIProvider implements AIProviderAdapter {
  constructor(private apiKey: string) {}

  async generateInsight(systemPrompt: string, userPrompt: string) {
    const client = new OpenAI({ apiKey: this.apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return parseAIResponse(text);
  }
}
