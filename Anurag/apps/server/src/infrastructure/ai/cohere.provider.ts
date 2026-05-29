import { env } from "../../config/env.js";
import type { AIProviderAdapter } from "./provider.interface.js";
import { parseAIResponse } from "./response.formatter.js";
import { AppError } from "../../common/errors/app-error.js";

interface CohereChatResponse {
  message?: {
    content?: { type?: string; text?: string }[];
  };
}

export class CohereProvider implements AIProviderAdapter {
  constructor(private apiKey: string) {}

  async generateInsight(systemPrompt: string, userPrompt: string) {
    const response = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.COHERE_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${userPrompt}\n\nRespond with valid JSON only.`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw AppError.badRequest(
        `Cohere API error (${response.status}): ${errBody.slice(0, 200)}`
      );
    }

    const data = (await response.json()) as CohereChatResponse;
    const text =
      data.message?.content
        ?.filter((c) => c.type === "text" || c.text)
        .map((c) => c.text ?? "")
        .join("") ?? "";

    if (!text) {
      throw AppError.badRequest("Cohere returned an empty response");
    }

    return parseAIResponse(text);
  }
}
