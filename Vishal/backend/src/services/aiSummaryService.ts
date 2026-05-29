import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import {
  getDayLabel,
  formatCurrency,
  getWeeklyBudget,
  sumFixedExpenses,
} from "../utils/tracker.js";
import {
  generateFinancialInsight,
  isCohereConfigured,
  formatAiAnalysisForEmail,
  type AIInsightResponse,
} from "./cohereService.js";
import { getPage, getOrCreateSettings } from "./trackerService.js";
import type { TrackerPageDto } from "../types/tracker.js";

export interface AISummaryDto {
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

function mapSummary(row: {
  id: string;
  date: string;
  type: string;
  pageId: string | null;
  dayIndex: number | null;
  summary: string;
  totalSpent: number;
  insights: string[];
  recommendations: string[];
  createdAt: Date;
}): AISummaryDto {
  return {
    id: row.id,
    date: row.date,
    type: row.type as "daily" | "weekly",
    pageId: row.pageId,
    dayIndex: row.dayIndex,
    summary: row.summary,
    totalSpent: row.totalSpent,
    insights: row.insights,
    recommendations: row.recommendations,
    createdAt: row.createdAt.toISOString(),
  };
}

function weekStartDateString(): string {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  return weekStart.toISOString().split("T")[0]!;
}

function todayDateString(): string {
  return new Date().toISOString().split("T")[0]!;
}

async function persistSummary(
  userId: string,
  scopeKey: string,
  data: {
    date: string;
    type: string;
    pageId?: string | null;
    dayIndex?: number | null;
    summary: string;
    totalSpent: number;
    insights: string[];
    recommendations: string[];
  }
): Promise<AISummaryDto> {
  const row = await prisma.aISummary.upsert({
    where: { userId_scopeKey: { userId, scopeKey } },
    create: { userId, scopeKey, ...data },
    update: {
      summary: data.summary,
      totalSpent: data.totalSpent,
      insights: data.insights,
      recommendations: data.recommendations,
    },
  });

  return mapSummary(row);
}

function buildFallbackWeekly(
  page: TrackerPageDto,
  currency: string,
  monthlyBudget: number,
  fixedExpenses: Array<{ title: string; amount: number }>
): AIInsightResponse {
  const weeklyBudget = getWeeklyBudget(monthlyBudget, fixedExpenses);
  const isOver = weeklyBudget > 0 && page.pageTotal > weeklyBudget;
  const fixedTotal = sumFixedExpenses(fixedExpenses);

  return {
    summary: `Weekly total: ${formatCurrency(page.pageTotal, currency)}. ${
      isOver ? "You are over your weekly budget target." : "You are within your weekly budget."
    }`,
    insights: [
      `Total entries: ${page.days.reduce((n, d) => n + d.entries.length, 0)}`,
      `Monthly budget: ${formatCurrency(monthlyBudget, currency)}`,
      fixedTotal > 0
        ? `Fixed expenses: ${formatCurrency(fixedTotal, currency)}`
        : "No fixed expenses configured",
      `Weekly target: ${formatCurrency(weeklyBudget, currency)}`,
    ],
    recommendations: [
      isOver
        ? "Review discretionary categories and reduce non-essential spending next week"
        : "Keep tracking daily to maintain this pace",
      isCohereConfigured()
        ? "AI analysis failed — try generating again from the dashboard"
        : "Add COHERE_API_KEY to enable AI-powered insights",
    ],
  };
}

export async function listSummaries(
  userId: string,
  type: "daily" | "weekly",
  limit: number
): Promise<AISummaryDto[]> {
  const rows = await prisma.aISummary.findMany({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapSummary);
}

export async function generateWeeklySummary(
  userId: string,
  pageId: string
): Promise<AISummaryDto> {
  const page = await getPage(userId, pageId);
  const settings = await getOrCreateSettings(userId);
  const date = weekStartDateString();
  const scopeKey = `weekly:${date}:${pageId}`;
  const weeklyBudget = getWeeklyBudget(settings.monthlyBudget, settings.fixedExpenses);
  const fixedTotal = sumFixedExpenses(settings.fixedExpenses);

  const categories: Record<string, number> = {};
  const byDay: Record<number, number> = {};

  for (const day of page.days) {
    byDay[day.dayIndex] = day.entries.reduce((s, e) => s + e.amount, 0);
    for (const entry of day.entries) {
      const cat = entry.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + entry.amount;
    }
  }

  const entryCount = page.days.reduce((n, d) => n + d.entries.length, 0);

  if (entryCount === 0) {
    return persistSummary(userId, scopeKey, {
      date,
      type: "weekly",
      pageId,
      summary: "No spending data this week. Add entries to get AI insights.",
      totalSpent: 0,
      insights: ["No transactions recorded"],
      recommendations: ["Start logging daily expenses in your tracker"],
    });
  }

  const prompt = `
Analyze this weekly financial data for user "${page.title}":

Total spent this week: ${formatCurrency(page.pageTotal, settings.currency)}
Monthly budget: ${formatCurrency(settings.monthlyBudget, settings.currency)}
Fixed monthly expenses: ${formatCurrency(fixedTotal, settings.currency)}
Available monthly budget (after fixed): ${formatCurrency(settings.monthlyBudget - fixedTotal, settings.currency)}
Weekly budget target: ${formatCurrency(weeklyBudget, settings.currency)}
Status: ${weeklyBudget > 0 && page.pageTotal > weeklyBudget ? "OVER weekly budget" : "Within weekly budget"}
${settings.fixedExpenses.length > 0 ? `\nFixed expenses:\n${settings.fixedExpenses.map((e) => `- ${e.title}: ${formatCurrency(e.amount, settings.currency)}`).join("\n")}` : ""}

Spending by day (dayIndex 1=Mon … 7=Sun):
${page.days
  .map(
    (d) =>
      `- ${getDayLabel(d.dayIndex)}: ${formatCurrency(
        d.entries.reduce((s, e) => s + e.amount, 0),
        settings.currency
      )} (${d.entries.length} entries)`
  )
  .join("\n")}

Spending by category:
${Object.entries(categories)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amt]) => `- ${cat}: ${formatCurrency(amt, settings.currency)}`)
  .join("\n")}

Transaction count: ${entryCount}

Provide actionable weekly analysis with budget warnings if over target.
`;

  let ai: AIInsightResponse;
  try {
    ai = isCohereConfigured()
      ? await generateFinancialInsight(prompt)
      : buildFallbackWeekly(
          page,
          settings.currency,
          settings.monthlyBudget,
          settings.fixedExpenses
        );
  } catch {
    ai = buildFallbackWeekly(
      page,
      settings.currency,
      settings.monthlyBudget,
      settings.fixedExpenses
    );
  }

  return persistSummary(userId, scopeKey, {
    date,
    type: "weekly",
    pageId,
    summary: ai.summary,
    totalSpent: page.pageTotal,
    insights: ai.insights,
    recommendations: ai.recommendations,
  });
}

export async function generateDailySummary(
  userId: string,
  pageId: string,
  dayIndex: number
): Promise<AISummaryDto> {
  if (dayIndex < 1 || dayIndex > 7) {
    throw new ApiError(400, "INVALID_DAY", "dayIndex must be between 1 and 7");
  }

  const page = await getPage(userId, pageId);
  const settings = await getOrCreateSettings(userId);
  const date = todayDateString();
  const scopeKey = `daily:${date}:${pageId}:${dayIndex}`;
  const availableMonthly =
    settings.monthlyBudget - sumFixedExpenses(settings.fixedExpenses);
  const dailyBudget = availableMonthly > 0 ? availableMonthly / 30 : 0;

  const getDayData = (idx: number) => {
    const day = page.days.find((d) => d.dayIndex === idx);
    const total = day?.entries.reduce((s, e) => s + e.amount, 0) ?? 0;
    const cats: Record<string, number> = {};
    for (const e of day?.entries ?? []) {
      const c = e.category || "Uncategorized";
      cats[c] = (cats[c] || 0) + e.amount;
    }
    return { total, cats, entries: day?.entries ?? [], label: getDayLabel(idx) };
  };

  const current = getDayData(dayIndex);
  // Only compare earlier days in the same week (no wrap Mon → Sun).
  const prev1 = dayIndex > 1 ? getDayData(dayIndex - 1) : null;
  const prev2 = dayIndex > 2 ? getDayData(dayIndex - 2) : null;

  if (current.entries.length === 0) {
    return persistSummary(userId, scopeKey, {
      date,
      type: "daily",
      pageId,
      dayIndex,
      summary: `No entries on ${current.label}. Add spending to get analysis.`,
      totalSpent: 0,
      insights: ["No spending recorded for this day"],
      recommendations: ["Use Add on the day card to log expenses"],
    });
  }

  const comparisonDays = [prev2, prev1, current].filter(
    (d): d is NonNullable<typeof d> => d !== null
  );
  const priorContext =
    comparisonDays.length > 1
      ? comparisonDays
          .slice(0, -1)
          .map(
            (d) =>
              `- ${d.label}: ${formatCurrency(d.total, settings.currency)} (categories: ${JSON.stringify(d.cats)})`
          )
          .join("\n")
      : "No prior days in this week to compare.";

  const prompt = `
Analyze spending for ${current.label}${comparisonDays.length > 1 ? " with prior days in the same week" : ""}:

TODAY (${current.label}): ${formatCurrency(current.total, settings.currency)}
Categories: ${JSON.stringify(current.cats)}
Entries: ${current.entries.map((e) => `${e.title} ${formatCurrency(e.amount, settings.currency)}`).join(", ")}

Earlier days this week:
${priorContext}

Daily budget target: ${formatCurrency(dailyBudget, settings.currency)}
Monthly budget: ${formatCurrency(settings.monthlyBudget, settings.currency)}
Fixed expenses (monthly): ${formatCurrency(sumFixedExpenses(settings.fixedExpenses), settings.currency)}

Compare trends across available days, category changes, and budget status. Be concise and actionable.
`;

  let ai: AIInsightResponse;
  try {
    ai = isCohereConfigured()
      ? await generateFinancialInsight(prompt)
      : {
          summary: `You spent ${formatCurrency(current.total, settings.currency)} on ${current.label}. ${
            current.total > dailyBudget && dailyBudget > 0
              ? "Above daily budget target."
              : "Within daily budget."
          }`,
          insights: [
            `Today: ${formatCurrency(current.total, settings.currency)}`,
            ...(prev1
              ? [`Previous (${prev1.label}): ${formatCurrency(prev1.total, settings.currency)}`]
              : []),
            ...(prev2
              ? [`Two days before (${prev2.label}): ${formatCurrency(prev2.total, settings.currency)}`]
              : []),
          ],
          recommendations: ["Track consistently for better trend analysis"],
        };
  } catch {
    ai = {
      summary: `Spent ${formatCurrency(current.total, settings.currency)} on ${current.label}.`,
      insights: [],
      recommendations: ["AI temporarily unavailable — try again shortly"],
    };
  }

  return persistSummary(userId, scopeKey, {
    date,
    type: "daily",
    pageId,
    dayIndex,
    summary: ai.summary,
    totalSpent: current.total,
    insights: ai.insights,
    recommendations: ai.recommendations,
  });
}

export async function generateWeeklyReportInsight(
  _userId: string,
  page: TrackerPageDto,
  currency: string,
  monthlyBudget: number,
  fixedExpenses: Array<{ title: string; amount: number }> = []
): Promise<AIInsightResponse> {
  const weeklyBudget = getWeeklyBudget(monthlyBudget, fixedExpenses);
  const prompt = `
Weekly spending report:
Total: ${formatCurrency(page.pageTotal, currency)}
Weekly budget: ${formatCurrency(weeklyBudget, currency)}
Over budget: ${page.pageTotal > weeklyBudget}
Entries: ${page.days.reduce((n, d) => n + d.entries.length, 0)}

Give 4-6 bullet points: patterns, warnings, daily target for next week, encouragement.
`;

  if (!isCohereConfigured()) {
    return buildFallbackWeekly(page, currency, monthlyBudget, fixedExpenses);
  }

  try {
    return await generateFinancialInsight(prompt);
  } catch {
    return buildFallbackWeekly(page, currency, monthlyBudget, fixedExpenses);
  }
}

export async function generateWeeklyAnalysisForEmail(
  userId: string,
  page: TrackerPageDto,
  currency: string,
  monthlyBudget: number,
  fixedExpenses: Array<{ title: string; amount: number }> = []
): Promise<string> {
  const insight = await generateWeeklyReportInsight(
    userId,
    page,
    currency,
    monthlyBudget,
    fixedExpenses
  );
  return formatAiAnalysisForEmail(insight);
}
