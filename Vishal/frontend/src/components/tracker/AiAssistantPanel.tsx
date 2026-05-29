import { useState } from "react";
import {
  Calendar,
  Lightbulb,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  useAiStatus,
  useDailySummaries,
  useGenerateDailySummary,
  useGenerateWeeklySummary,
  useWeeklySummaries,
} from "@/hooks/useAi";
import { formatCurrency, getDayLabel } from "@/lib/trackerUtils";
import type { AISummary } from "@/types/ai";
import { cn } from "@/lib/utils";

interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  pageId: string | undefined;
  currency: string;
}

export function AiAssistantPanel({ open, onClose, pageId, currency }: AiAssistantPanelProps) {
  const [tab, setTab] = useState<"daily" | "weekly">("weekly");
  const [selectedDay, setSelectedDay] = useState(1);

  const { data: aiStatus } = useAiStatus();
  const { data: dailySummaries = [], isLoading: loadingDaily } = useDailySummaries(open);
  const { data: weeklySummaries = [], isLoading: loadingWeekly } = useWeeklySummaries(open);

  const generateWeekly = useGenerateWeeklySummary();
  const generateDaily = useGenerateDailySummary();

  if (!open) return null;

  const isGenerating = generateWeekly.isPending || generateDaily.isPending;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Close AI panel"
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl",
          "animate-fade-in sm:max-w-md"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900">AI Assistant</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-500">
            Powered by{" "}
            <span className="font-medium text-indigo-600">Cohere</span>
            {aiStatus?.configured ? (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                Connected
              </span>
            ) : (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                Not configured
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-1 border-b border-slate-100 p-2">
          {(["daily", "weekly"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "weekly" ? (
            <div className="space-y-4">
              <Button
                className="w-full"
                disabled={!pageId || isGenerating}
                onClick={() => pageId && generateWeekly.mutate(pageId)}
              >
                {generateWeekly.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate weekly summary
                  </>
                )}
              </Button>

              {loadingWeekly ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-6 w-6 text-indigo-600" />
                </div>
              ) : weeklySummaries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No weekly summaries yet. Generate your first one!
                </p>
              ) : (
                weeklySummaries.map((s) => (
                  <SummaryCard key={s.id} summary={s} currency={currency} />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Analyze day
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>
                      {getDayLabel(d)}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="w-full"
                disabled={!pageId || isGenerating}
                onClick={() =>
                  pageId && generateDaily.mutate({ pageId, dayIndex: selectedDay })
                }
              >
                {generateDaily.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate daily summary
                  </>
                )}
              </Button>

              {loadingDaily ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-6 w-6 text-indigo-600" />
                </div>
              ) : dailySummaries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No daily summaries yet.
                </p>
              ) : (
                dailySummaries.map((s) => (
                  <SummaryCard key={s.id} summary={s} currency={currency} />
                ))
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function SummaryCard({ summary, currency }: { summary: AISummary; currency: string }) {
  const typeLabel = summary.type === "daily" ? "Daily" : "Weekly";
  const dayNote =
    summary.dayIndex != null ? ` · ${getDayLabel(summary.dayIndex)}` : "";

  return (
    <Card className="border-slate-200/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-indigo-500" />
            {typeLabel} summary{dayNote}
          </CardTitle>
          <span className="shrink-0 text-xs text-slate-400">{summary.date}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-indigo-50/80 px-3 py-2">
          <span className="text-slate-600">Total spent</span>
          <span className="font-semibold">{formatCurrency(summary.totalSpent, currency)}</span>
        </div>
        <p className="text-slate-700">{summary.summary}</p>
        {summary.insights.length > 0 && (
          <div>
            <div className="mb-1 flex items-center gap-1 font-medium text-slate-800">
              <TrendingUp className="h-3.5 w-3.5" />
              Insights
            </div>
            <ul className="space-y-1 text-slate-600">
              {summary.insights.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {summary.recommendations.length > 0 && (
          <div>
            <div className="mb-1 flex items-center gap-1 font-medium text-slate-800">
              <Lightbulb className="h-3.5 w-3.5" />
              Recommendations
            </div>
            <ul className="space-y-1 text-slate-600">
              {summary.recommendations.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
