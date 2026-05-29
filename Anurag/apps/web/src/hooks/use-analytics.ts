import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { AnalyticsSummary } from "@anurag/types";

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => apiGet<AnalyticsSummary>("/analytics/summary").then((r) => r.data),
  });
}

export function useAnalyticsTrends(months = 6) {
  return useQuery({
    queryKey: ["analytics", "trends", months],
    queryFn: () =>
      apiGet<{ label: string; total: string }[]>("/analytics/trends", { months }).then(
        (r) => r.data
      ),
  });
}

export function useAnalyticsByCategory() {
  return useQuery({
    queryKey: ["analytics", "by-category"],
    queryFn: () =>
      apiGet<{ categoryId: string; name: string; total: string; color: string | null }[]>(
        "/analytics/by-category"
      ).then((r) => r.data),
  });
}
