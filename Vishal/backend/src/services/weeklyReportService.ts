import { prisma } from "../lib/prisma.js";
import {
  calculatePageTotal,
  getWeeklyBudget,
  parseFixedExpenses,
  type FixedExpenseDto,
} from "../utils/tracker.js";
import type { TrackerPageDto } from "../types/tracker.js";
import type { WeeklyEmailData } from "./emailService.js";
import type { AIInsightResponse } from "./cohereService.js";
import { formatAiAnalysisForEmail } from "./cohereService.js";
import { generateWeeklyReportInsight } from "./aiSummaryService.js";
import {
  generateWeeklyPdf,
  weeklyReportPdfFilename,
  type WeeklyPdfReportInput,
} from "./pdfService.js";

export interface WeeklyReportPackage {
  email: string;
  data: WeeklyEmailData;
  page: TrackerPageDto;
  insight: AIInsightResponse;
  fixedExpenses: FixedExpenseDto[];
}

function mapPageFromDb(page: {
  id: string;
  title: string;
  icon: string;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  days: Array<{
    id: string;
    dayIndex: number;
    entries: Array<{
      id: string;
      title: string;
      amount: number;
      description: string;
      category: string;
      tags: string[];
      sortOrder: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }>;
}): TrackerPageDto {
  const days = page.days.map((day) => ({
    id: day.id,
    dayIndex: day.dayIndex,
    entries: day.entries.map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      description: e.description,
      category: e.category,
      tags: e.tags,
      sortOrder: e.sortOrder,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  }));

  return {
    id: page.id,
    title: page.title,
    icon: page.icon,
    folderId: page.folderId,
    days,
    pageTotal: calculatePageTotal(days),
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function buildWeeklyAnalysis(
  page: TrackerPageDto,
  currency: string,
  weeklyBudget: number
): string {
  const isOverBudget = page.pageTotal > weeklyBudget;
  const topDay = [...page.days]
    .map((d) => ({
      label: d.dayIndex,
      total: d.entries.reduce((s, e) => s + e.amount, 0),
      count: d.entries.length,
    }))
    .sort((a, b) => b.total - a.total)[0];

  const categories: Record<string, number> = {};
  for (const day of page.days) {
    for (const entry of day.entries) {
      const cat = entry.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + entry.amount;
    }
  }

  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  const dailyTarget = weeklyBudget > 0 ? weeklyBudget / 7 : 0;

  const lines = [
    `• Total entries: ${page.days.reduce((n, d) => n + d.entries.length, 0)}`,
    `• Weekly spend: ${currency}${page.pageTotal.toFixed(2)}`,
    topCategory
      ? `• Top category: ${topCategory[0]} (${currency}${topCategory[1].toFixed(2)})`
      : "• No categorized spending recorded",
    topDay && topDay.total > 0
      ? `• Highest day: Day ${topDay.label} (${currency}${topDay.total.toFixed(2)}, ${topDay.count} entries)`
      : "• No spending recorded this week",
    dailyTarget > 0
      ? `• Suggested daily spend: ${currency}${dailyTarget.toFixed(2)} to stay on track`
      : "• Set a monthly budget in settings for personalized targets",
    isOverBudget
      ? "• ⚠️ You are over your weekly budget — review discretionary expenses."
      : "• ✓ You are within your weekly budget. Keep up the good work!",
  ];

  return lines.join("\n");
}

export function toWeeklyPdfInput(pkg: WeeklyReportPackage): WeeklyPdfReportInput {
  return {
    page: pkg.page,
    currency: pkg.data.currency,
    userName: pkg.data.userName,
    monthlyBudget: pkg.data.monthlyBudget,
    weeklyBudget: pkg.data.weeklyBudget,
    weekTotal: pkg.data.weekTotal,
    difference: pkg.data.difference,
    isOverBudget: pkg.data.isOverBudget,
    fixedExpenses: pkg.fixedExpenses,
    insight: pkg.insight,
  };
}

export function buildWeeklyPdfBuffer(pkg: WeeklyReportPackage): {
  buffer: Buffer;
  filename: string;
} {
  return {
    buffer: generateWeeklyPdf(toWeeklyPdfInput(pkg)),
    filename: weeklyReportPdfFilename(pkg.page.title),
  };
}

export async function buildWeeklyReportPackage(
  userId: string,
  pageId: string
): Promise<WeeklyReportPackage> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const pageRecord = await prisma.trackerPage.findFirst({
    where: { id: pageId, userId },
    include: {
      days: {
        orderBy: { dayIndex: "asc" },
        include: {
          entries: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        },
      },
    },
  });

  if (!pageRecord) {
    throw new Error("Page not found");
  }

  const settings = user.settings ?? {
    currency: "₹",
    monthlyBudget: 0,
    fixedExpenses: [] as unknown,
    weeklyReportsEnabled: false,
  };
  const fixedExpenses = parseFixedExpenses(settings.fixedExpenses);

  const page = mapPageFromDb(pageRecord);
  const weeklyBudget = getWeeklyBudget(settings.monthlyBudget, fixedExpenses);
  const difference = weeklyBudget > 0 ? page.pageTotal - weeklyBudget : 0;

  const insight = await generateWeeklyReportInsight(
    userId,
    page,
    settings.currency,
    settings.monthlyBudget,
    fixedExpenses
  );

  const data: WeeklyEmailData = {
    userName: user.name,
    currency: settings.currency,
    monthlyBudget: settings.monthlyBudget,
    weeklyBudget,
    weekTotal: page.pageTotal,
    difference,
    isOverBudget: weeklyBudget > 0 && difference > 0,
    pageTitle: page.title,
    analysis: formatAiAnalysisForEmail(insight),
  };

  return { email: user.email, data, page, insight, fixedExpenses };
}

export async function getUsersForWeeklyCron() {
  return prisma.user.findMany({
    where: {
      settings: { weeklyReportsEnabled: true },
    },
    include: {
      settings: true,
      trackerPages: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          days: {
            orderBy: { dayIndex: "asc" },
            include: { entries: true },
          },
        },
      },
    },
  });
}
