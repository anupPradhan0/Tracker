import { api } from "@/services/api";
import type { ApiSuccess } from "@/types/api";
import type { AISummary, AiStatus } from "@/types/ai";

function unwrap<T>(data: ApiSuccess<T>): T {
  return data.data;
}

export const aiApi = {
  async getStatus(): Promise<AiStatus> {
    const { data } = await api.get<ApiSuccess<AiStatus>>("/api/ai/status");
    return unwrap(data);
  },

  async getDailySummaries(limit = 7): Promise<AISummary[]> {
    const { data } = await api.get<ApiSuccess<AISummary[]>>("/api/ai/summary/daily", {
      params: { limit },
    });
    return unwrap(data);
  },

  async getWeeklySummaries(limit = 4): Promise<AISummary[]> {
    const { data } = await api.get<ApiSuccess<AISummary[]>>("/api/ai/summary/weekly", {
      params: { limit },
    });
    return unwrap(data);
  },

  async generateWeekly(pageId: string): Promise<AISummary> {
    const { data } = await api.post<ApiSuccess<AISummary>>("/api/ai/summary/weekly", {
      pageId,
    });
    return unwrap(data);
  },

  async generateDaily(pageId: string, dayIndex: number): Promise<AISummary> {
    const { data } = await api.post<ApiSuccess<AISummary>>("/api/ai/summary/daily", {
      pageId,
      dayIndex,
    });
    return unwrap(data);
  },
};
