export interface AISummary {
  id: string;
  date: string;
  type: "daily" | "weekly";
  pageId: string | null;
  dayIndex: number | null;
  summary: string;
  totalSpent: number;
  insights: string[];
  recommendations: string[];
  createdAt: string;
}

export interface AiStatus {
  configured: boolean;
  provider: string;
}
