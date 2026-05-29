import { lazy, Suspense, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, Sparkles } from "lucide-react";
import { useAnalyticsTrends, useAnalyticsByCategory } from "@/hooks/use-analytics";
import { useSendExpenseEmail } from "@/hooks/use-send-expense-email";
import { useAuthStore } from "@/stores/auth-store";
import { apiPost, formatApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";
import type { AiInsightResponse } from "@anurag/types";

const TrendsChart = lazy(() =>
  import("./analytics-charts").then((m) => ({ default: m.TrendsChart }))
);
const CategoryChart = lazy(() =>
  import("./analytics-charts").then((m) => ({ default: m.CategoryChart }))
);

function ChartFallback() {
  return <Skeleton className="h-[220px] w-full sm:h-full sm:min-h-[200px]" />;
}

export function AnalyticsPage() {
  const currency = useAuthStore((s) => s.user?.currency) ?? "INR";
  const {
    data: trends,
    isLoading: trendsLoading,
    isError: trendsError,
    error: trendsErr,
  } = useAnalyticsTrends();
  const {
    data: byCategory,
    isLoading: catLoading,
    isError: catError,
    error: catErr,
  } = useAnalyticsByCategory();
  const sendEmail = useSendExpenseEmail("MONTHLY");

  const generateAi = useMutation({
    mutationFn: (period: "WEEKLY" | "MONTHLY"): Promise<AiInsightResponse & { id: string }> =>
      apiPost<AiInsightResponse & { id: string }>("/ai/summary", { period }),
    onSuccess: (data) => {
      toast.success("AI summary generated");
      setInsight(data);
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const [insight, setInsight] = useState<AiInsightResponse | null>(null);
  const aiLoading = generateAi.isPending;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Analytics"
        description="Trends, categories, and AI insights"
        actions={
          <>
            <Button
              className="w-full sm:w-auto"
              onClick={() => sendEmail.mutate()}
              disabled={sendEmail.isPending || aiLoading}
            >
              <Mail className="h-4 w-4" />
              {sendEmail.isPending ? "Sending…" : "Email report"}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => generateAi.mutate("WEEKLY")}
              disabled={aiLoading || sendEmail.isPending}
            >
              <Sparkles className="h-4 w-4" />
              {generateAi.isPending && generateAi.variables === "WEEKLY"
                ? "Generating…"
                : "Weekly AI"}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => generateAi.mutate("MONTHLY")}
              disabled={aiLoading || sendEmail.isPending}
            >
              <Sparkles className="h-4 w-4" />
              {generateAi.isPending && generateAi.variables === "MONTHLY"
                ? "Generating…"
                : "Monthly AI"}
            </Button>
          </>
        }
      />

      {insight && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>{insight.summary}</p>
            {insight.insights.length > 0 && (
              <ul className="list-disc space-y-2 pl-5">
                {insight.insights.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] min-h-[13.75rem] w-full sm:h-64 sm:min-h-[16rem]">
          {trendsLoading ? (
            <ChartFallback />
          ) : trendsError ? (
            <p className="text-sm text-[var(--color-destructive)]">
              {trendsErr instanceof Error ? trendsErr.message : "Failed to load trends"}
            </p>
          ) : (
            <Suspense fallback={<ChartFallback />}>
              <TrendsChart currency={currency} trends={trends} />
            </Suspense>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By category</CardTitle>
        </CardHeader>
        <CardContent className="h-[240px] min-h-[15rem] w-full sm:h-64 sm:min-h-[16rem]">
          {catLoading ? (
            <ChartFallback />
          ) : catError ? (
            <p className="text-sm text-[var(--color-destructive)]">
              {catErr instanceof Error ? catErr.message : "Failed to load categories"}
            </p>
          ) : (
            <Suspense fallback={<ChartFallback />}>
              <CategoryChart currency={currency} byCategory={byCategory} />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
