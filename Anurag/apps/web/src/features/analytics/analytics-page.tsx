import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles } from "lucide-react";
import { formatCurrency } from "@anurag/utils";
import { useAnalyticsTrends, useAnalyticsByCategory } from "@/hooks/use-analytics";
import { useAuthStore } from "@/stores/auth-store";
import { apiPost } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { AiInsightResponse } from "@anurag/types";

const COLORS = ["#3b82f6", "#f97316", "#8b5cf6", "#22c55e", "#ec4899", "#6b7280"];

export function AnalyticsPage() {
  const currency = useAuthStore((s) => s.user?.currency) ?? "INR";
  const { data: trends, isLoading: trendsLoading } = useAnalyticsTrends();
  const { data: byCategory, isLoading: catLoading } = useAnalyticsByCategory();

  const generateAi = useMutation({
    mutationFn: (period: "WEEKLY" | "MONTHLY") =>
      apiPost<AiInsightResponse & { id: string }>("/ai/summary", { period }),
    onSuccess: (data) => {
      toast.success("AI summary generated");
      setInsight(data);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [insight, setInsight] = useState<AiInsightResponse | null>(null);

  const chartData = trends?.map((t) => ({
    name: t.label,
    total: parseFloat(t.total),
  }));

  const pieData = byCategory?.map((c) => ({
    name: c.name,
    value: parseFloat(c.total),
    color: c.color,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateAi.mutate("WEEKLY")}
            disabled={generateAi.isPending}
          >
            <Sparkles className="h-4 w-4" />
            Weekly AI
          </Button>
          <Button
            size="sm"
            onClick={() => generateAi.mutate("MONTHLY")}
            disabled={generateAi.isPending}
          >
            <Sparkles className="h-4 w-4" />
            Monthly AI
          </Button>
        </div>
      </div>

      {insight && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{insight.summary}</p>
            {insight.insights.length > 0 && (
              <ul className="list-disc pl-5 space-y-1">
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
        <CardContent className="h-64">
          {trendsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By category</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {catLoading ? (
            <Skeleton className="h-full w-full" />
          ) : pieData?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieData[i]?.color ?? COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">No data this month</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
