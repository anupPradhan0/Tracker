import jsPDF from "jspdf";
import type { AIInsightResponse } from "./cohereService.js";
import {
  getDayLabel,
  formatCurrency,
  getRealMonthlyBudget,
  sumFixedExpenses,
  type FixedExpenseDto,
} from "../utils/tracker.js";
import type { TrackerPageDto } from "../types/tracker.js";

export interface WeeklyPdfReportInput {
  page: TrackerPageDto;
  currency: string;
  userName: string;
  monthlyBudget: number;
  weeklyBudget: number;
  weekTotal: number;
  difference: number;
  isOverBudget: boolean;
  fixedExpenses: FixedExpenseDto[];
  insight: AIInsightResponse;
}

const MARGIN = 20;
const LINE_HEIGHT = 7;
const PAGE_BOTTOM = 265;

type PdfContext = {
  doc: jsPDF;
  yPos: number;
  pageWidth: number;
};

function aggregateCategories(page: TrackerPageDto): Array<[string, number]> {
  const categories: Record<string, number> = {};
  for (const day of page.days) {
    for (const entry of day.entries) {
      const cat = entry.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + entry.amount;
    }
  }
  return Object.entries(categories).sort((a, b) => b[1] - a[1]);
}

function ensureSpace(ctx: PdfContext, needed: number): PdfContext {
  if (ctx.yPos + needed <= PAGE_BOTTOM) {
    return ctx;
  }
  ctx.doc.addPage();
  return { ...ctx, yPos: 20 };
}

function drawSectionTitle(ctx: PdfContext, title: string): PdfContext {
  let next = ensureSpace(ctx, LINE_HEIGHT * 2);
  next.doc.setFontSize(13);
  next.doc.setFont("helvetica", "bold");
  next.doc.setTextColor(51, 51, 51);
  next.doc.text(title, MARGIN, next.yPos);
  next.yPos += LINE_HEIGHT * 1.5;
  return next;
}

function drawWrappedText(
  ctx: PdfContext,
  text: string,
  options?: { fontSize?: number; indent?: number }
): PdfContext {
  const fontSize = options?.fontSize ?? 10;
  const indent = options?.indent ?? 0;
  const maxWidth = ctx.pageWidth - MARGIN * 2 - indent;
  const lines = ctx.doc.splitTextToSize(text, maxWidth);

  let next = ctx;
  next.doc.setFontSize(fontSize);
  next.doc.setFont("helvetica", "normal");
  next.doc.setTextColor(0, 0, 0);

  for (const line of lines) {
    next = ensureSpace(next, LINE_HEIGHT);
    next.doc.text(line, MARGIN + indent, next.yPos);
    next.yPos += LINE_HEIGHT;
  }
  return next;
}

function drawBulletList(ctx: PdfContext, items: string[]): PdfContext {
  let next = ctx;
  for (const item of items) {
    next = ensureSpace(next, LINE_HEIGHT);
    const lines = next.doc.splitTextToSize(`• ${item}`, next.pageWidth - MARGIN * 2 - 5);
    for (const line of lines) {
      next = ensureSpace(next, LINE_HEIGHT);
      next.doc.setFontSize(10);
      next.doc.setFont("helvetica", "normal");
      next.doc.setTextColor(0, 0, 0);
      next.doc.text(line, MARGIN + 5, next.yPos);
      next.yPos += LINE_HEIGHT;
    }
  }
  return next;
}

function drawBudgetOverview(ctx: PdfContext, input: WeeklyPdfReportInput): PdfContext {
  let next = drawSectionTitle(ctx, "Budget overview");
  const { currency, monthlyBudget, weeklyBudget, weekTotal, difference, isOverBudget, fixedExpenses } =
    input;
  const fixedTotal = sumFixedExpenses(fixedExpenses);
  const availableMonthly = getRealMonthlyBudget(monthlyBudget, fixedExpenses);

  const rows: Array<[string, string]> = [
    ["Monthly budget", formatCurrency(monthlyBudget, currency)],
  ];

  if (fixedExpenses.length > 0) {
    rows.push(["Fixed expenses", formatCurrency(fixedTotal, currency)]);
    for (const expense of fixedExpenses) {
      rows.push([`  ${expense.title}`, formatCurrency(expense.amount, currency)]);
    }
    rows.push(["Available monthly", formatCurrency(availableMonthly, currency)]);
  }

  rows.push(
    ["Weekly budget target", formatCurrency(weeklyBudget, currency)],
    ["Spent this week", formatCurrency(weekTotal, currency)],
    [
      "Difference",
      `${formatCurrency(Math.abs(difference), currency)} ${isOverBudget ? "over" : "under"}`,
    ],
    ["Status", isOverBudget ? "OVER weekly budget" : "WITHIN weekly budget"]
  );

  next.doc.setFontSize(10);
  for (const [label, value] of rows) {
    next = ensureSpace(next, LINE_HEIGHT);
    next.doc.setFont("helvetica", "normal");
    next.doc.setTextColor(100, 100, 100);
    next.doc.text(label, MARGIN, next.yPos);
    next.doc.setFont("helvetica", "bold");
    next.doc.setTextColor(0, 0, 0);
    const valueWidth = next.doc.getTextWidth(value);
    next.doc.text(value, next.pageWidth - MARGIN - valueWidth, next.yPos);
    next.yPos += LINE_HEIGHT;
  }

  next.yPos += LINE_HEIGHT / 2;
  next.doc.setDrawColor(200, 200, 200);
  next.doc.line(MARGIN, next.yPos, next.pageWidth - MARGIN, next.yPos);
  next.yPos += LINE_HEIGHT;
  return next;
}

function drawSpendingByDay(ctx: PdfContext, input: WeeklyPdfReportInput): PdfContext {
  let next = drawSectionTitle(ctx, "Spending by day");
  const { page, currency } = input;

  for (const day of page.days) {
    const dayTotal = day.entries.reduce((sum, e) => sum + e.amount, 0);
    const label = getDayLabel(day.dayIndex);
    const detail = `${day.entries.length} entries · ${formatCurrency(dayTotal, currency)}`;

    next = ensureSpace(next, LINE_HEIGHT);
    next.doc.setFontSize(10);
    next.doc.setFont("helvetica", "bold");
    next.doc.setTextColor(51, 51, 51);
    next.doc.text(label, MARGIN, next.yPos);
    const detailWidth = next.doc.getTextWidth(detail);
    next.doc.setFont("helvetica", "normal");
    next.doc.setTextColor(100, 100, 100);
    next.doc.text(detail, next.pageWidth - MARGIN - detailWidth, next.yPos);
    next.yPos += LINE_HEIGHT;
  }

  next.yPos += LINE_HEIGHT / 2;
  return next;
}

function drawSpendingByCategory(ctx: PdfContext, input: WeeklyPdfReportInput): PdfContext {
  let next = drawSectionTitle(ctx, "Spending by category");
  const categories = aggregateCategories(input.page);

  if (categories.length === 0) {
    next = drawWrappedText(next, "No categorized spending recorded.", { fontSize: 10 });
    return next;
  }

  for (const [cat, amount] of categories) {
    next = ensureSpace(next, LINE_HEIGHT);
    next.doc.setFontSize(10);
    next.doc.setFont("helvetica", "normal");
    next.doc.setTextColor(0, 0, 0);
    next.doc.text(cat, MARGIN, next.yPos);
    const amountText = formatCurrency(amount, input.currency);
    const amountWidth = next.doc.getTextWidth(amountText);
    next.doc.setFont("helvetica", "bold");
    next.doc.text(amountText, next.pageWidth - MARGIN - amountWidth, next.yPos);
    next.yPos += LINE_HEIGHT;
  }

  next.yPos += LINE_HEIGHT / 2;
  return next;
}

function drawAnalysisSections(ctx: PdfContext, insight: AIInsightResponse): PdfContext {
  let next = drawSectionTitle(ctx, "Weekly analysis");
  next = drawWrappedText(next, insight.summary, { fontSize: 11 });

  if (insight.insights.length > 0) {
    next.yPos += LINE_HEIGHT / 2;
    next = drawSectionTitle(next, "Key insights");
    next = drawBulletList(next, insight.insights);
  }

  if (insight.recommendations.length > 0) {
    next.yPos += LINE_HEIGHT / 2;
    next = drawSectionTitle(next, "Recommendations");
    next = drawBulletList(next, insight.recommendations);
  }

  next.yPos += LINE_HEIGHT;
  next.doc.setDrawColor(200, 200, 200);
  next.doc.line(MARGIN, next.yPos, next.pageWidth - MARGIN, next.yPos);
  next.yPos += LINE_HEIGHT;
  return next;
}

function drawExpenseLog(ctx: PdfContext, input: WeeklyPdfReportInput): PdfContext {
  let next = drawSectionTitle(ctx, "Complete expense log");
  const { page, currency } = input;

  for (const day of page.days) {
    const dayTotal = day.entries.reduce((sum, e) => sum + e.amount, 0);

    next = ensureSpace(next, LINE_HEIGHT * 2);
    next.doc.setFontSize(12);
    next.doc.setFont("helvetica", "bold");
    next.doc.setTextColor(51, 51, 51);
    next.doc.text(getDayLabel(day.dayIndex), MARGIN, next.yPos);
    next.yPos += LINE_HEIGHT;

    next.doc.setFontSize(10);
    next.doc.setFont("helvetica", "normal");
    next.doc.setTextColor(100, 100, 100);
    next.doc.text(
      `${day.entries.length} entries · ${formatCurrency(dayTotal, currency)}`,
      MARGIN,
      next.yPos
    );
    next.yPos += LINE_HEIGHT;

    if (day.entries.length === 0) {
      next.doc.setTextColor(150, 150, 150);
      next.doc.text("No entries", MARGIN + 5, next.yPos);
      next.yPos += LINE_HEIGHT;
    } else {
      for (const entry of day.entries) {
        next = ensureSpace(next, LINE_HEIGHT * 2);

        next.doc.setFontSize(11);
        next.doc.setFont("helvetica", "normal");
        next.doc.setTextColor(0, 0, 0);
        next.doc.text(`• ${entry.title}`, MARGIN + 5, next.yPos);

        next.doc.setFont("helvetica", "bold");
        const amountText = formatCurrency(entry.amount, currency);
        const amountWidth = next.doc.getTextWidth(amountText);
        next.doc.text(amountText, next.pageWidth - MARGIN - amountWidth, next.yPos);
        next.yPos += LINE_HEIGHT;

        if (entry.description || entry.category) {
          next.doc.setFontSize(9);
          next.doc.setFont("helvetica", "italic");
          next.doc.setTextColor(128, 128, 128);
          const details = [
            entry.category ? `[${entry.category}]` : "",
            entry.description || "",
          ]
            .filter(Boolean)
            .join(" — ");
          if (details) {
            next = ensureSpace(next, LINE_HEIGHT);
            next.doc.text(details, MARGIN + 10, next.yPos);
            next.yPos += LINE_HEIGHT;
          }
        }

        if (entry.tags.length > 0) {
          next = ensureSpace(next, LINE_HEIGHT);
          next.doc.setFontSize(8);
          next.doc.setTextColor(100, 100, 200);
          next.doc.text(`Tags: ${entry.tags.join(", ")}`, MARGIN + 10, next.yPos);
          next.yPos += LINE_HEIGHT;
        }
      }
    }

    next.yPos += LINE_HEIGHT / 2;
    next.doc.setDrawColor(230, 230, 230);
    next.doc.line(MARGIN, next.yPos, next.pageWidth - MARGIN, next.yPos);
    next.yPos += LINE_HEIGHT;
  }

  return next;
}

export function generateWeeklyPdf(input: WeeklyPdfReportInput): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const { page, currency, userName, weekTotal } = input;

  let ctx: PdfContext = { doc, yPos: 20, pageWidth };

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`${page.icon} ${page.title}`, MARGIN, ctx.yPos);
  ctx.yPos += LINE_HEIGHT * 2;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, MARGIN, ctx.yPos);
  doc.text(`Prepared for: ${userName}`, MARGIN, ctx.yPos + LINE_HEIGHT);
  ctx.yPos += LINE_HEIGHT * 3;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Weekly total: ${formatCurrency(weekTotal, currency)}`, MARGIN, ctx.yPos);
  ctx.yPos += LINE_HEIGHT * 2;

  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, ctx.yPos, pageWidth - MARGIN, ctx.yPos);
  ctx.yPos += LINE_HEIGHT;

  ctx = drawBudgetOverview(ctx, input);
  ctx = drawSpendingByDay(ctx, input);
  ctx = drawSpendingByCategory(ctx, input);
  ctx = drawAnalysisSections(ctx, input.insight);
  ctx = drawExpenseLog(ctx, input);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Finance Tracker — Weekly Report",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}

export function weeklyReportPdfFilename(pageTitle: string): string {
  return `${pageTitle.replace(/[^a-z0-9]/gi, "_")}_weekly_report.pdf`;
}
