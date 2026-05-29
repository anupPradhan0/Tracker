import jsPDF from "jspdf";
import { getDayLabel, formatCurrency } from "../utils/tracker.js";
import type { TrackerPageDto } from "../types/tracker.js";

export function generateWeeklyPdf(
  page: TrackerPageDto,
  currency: string,
  userName: string
): Buffer {
  const doc = new jsPDF();
  let yPos = 20;
  const lineHeight = 7;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${page.icon} ${page.title}`, 20, yPos);
  yPos += lineHeight * 2;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 20, yPos);
  doc.text(`Prepared for: ${userName}`, 20, yPos + lineHeight);
  yPos += lineHeight * 3;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Weekly Total: ${formatCurrency(page.pageTotal, currency)}`, 20, yPos);
  yPos += lineHeight * 2;

  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += lineHeight;

  for (const day of page.days) {
    if (yPos > 265) {
      doc.addPage();
      yPos = 20;
    }

    const dayTotal = day.entries.reduce((sum, e) => sum + e.amount, 0);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text(getDayLabel(day.dayIndex), 20, yPos);
    yPos += lineHeight;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${day.entries.length} entries · ${formatCurrency(dayTotal, currency)}`,
      20,
      yPos
    );
    yPos += lineHeight;

    if (day.entries.length === 0) {
      doc.setTextColor(150, 150, 150);
      doc.text("No entries", 25, yPos);
      yPos += lineHeight;
    } else {
      for (const entry of day.entries) {
        if (yPos > 265) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(`• ${entry.title}`, 25, yPos);

        doc.setFont("helvetica", "bold");
        const amountText = formatCurrency(entry.amount, currency);
        const amountWidth = doc.getTextWidth(amountText);
        doc.text(amountText, pageWidth - 20 - amountWidth, yPos);
        yPos += lineHeight;

        if (entry.description || entry.category) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(128, 128, 128);
          const details = [
            entry.category ? `[${entry.category}]` : "",
            entry.description || "",
          ]
            .filter(Boolean)
            .join(" — ");
          if (details) {
            doc.text(details, 30, yPos);
            yPos += lineHeight;
          }
        }

        if (entry.tags.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 200);
          doc.text(`Tags: ${entry.tags.join(", ")}`, 30, yPos);
          yPos += lineHeight;
        }
      }
    }

    yPos += lineHeight / 2;
    doc.setDrawColor(230, 230, 230);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += lineHeight;
  }

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
