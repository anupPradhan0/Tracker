import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aiApi } from "@/services/aiService";
import { getApiErrorMessage } from "@/services/api";

const DAILY_KEY = ["ai", "daily"] as const;
const WEEKLY_KEY = ["ai", "weekly"] as const;

export function useAiStatus() {
  return useQuery({
    queryKey: ["ai", "status"],
    queryFn: aiApi.getStatus,
    staleTime: 60_000,
  });
}

export function useDailySummaries(enabled: boolean) {
  return useQuery({
    queryKey: DAILY_KEY,
    queryFn: () => aiApi.getDailySummaries(7),
    enabled,
  });
}

export function useWeeklySummaries(enabled: boolean) {
  return useQuery({
    queryKey: WEEKLY_KEY,
    queryFn: () => aiApi.getWeeklySummaries(4),
    enabled,
  });
}

export function useGenerateWeeklySummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => aiApi.generateWeekly(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEEKLY_KEY });
      toast.success("Weekly AI summary generated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useGenerateDailySummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, dayIndex }: { pageId: string; dayIndex: number }) =>
      aiApi.generateDaily(pageId, dayIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DAILY_KEY });
      toast.success("Daily AI summary generated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
