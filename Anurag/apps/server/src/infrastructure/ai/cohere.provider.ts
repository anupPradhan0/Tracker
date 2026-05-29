import { env } from "../../config/env.js";
import type { AIProviderAdapter } from "./provider.interface.js";
import { parseAIResponse } from "./response.formatter.js";
import { AppError } from "../../common/errors/app-error.js";

const COHERE_TIMEOUT_MS = 10_000;

interface CohereContentBlock {
  type?: string;
  text?: string;
}

interface CohereChatResponse {
  message?: {
    content?: CohereContentBlock[];
  };
}

function extractCohereText(data: CohereChatResponse): string {
  return (
    data.message?.content
      ?.filter(
        (block): block is CohereContentBlock =>
          block != null && (block.type === "text" || typeof block.text === "string")
      )
      .map((block) => block.text ?? "")
      .join("") ?? ""
  );
}

export class CohereProvider implements AIProviderAdapter {
  constructor(private apiKey: string) {}

  async generateInsight(systemPrompt: string, userPrompt: string) {
    let response: Response;
    try {
      response = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(COHERE_TIMEOUT_MS),
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
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw AppError.badRequest("Cohere API request timed out");
      }
      throw error;
    }

    if (!response.ok) {
      const errBody = await response.text();
      throw AppError.badRequest(
        `Cohere API error (${response.status}): ${errBody.slice(0, 200)}`
      );
    }

    const data = (await response.json()) as CohereChatResponse;
    const text = extractCohereText(data);

    if (!text) {
      throw AppError.badRequest("Cohere returned an empty response");
    }

    return parseAIResponse(text);
  }
}
