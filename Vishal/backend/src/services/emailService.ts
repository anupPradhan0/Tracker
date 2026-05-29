import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { formatCurrency } from "../utils/tracker.js";

export interface WeeklyEmailData {
  userName: string;
  currency: string;
  monthlyBudget: number;
  weeklyBudget: number;
  weekTotal: number;
  difference: number;
  isOverBudget: boolean;
  pageTitle: string;
  analysis: string;
}

function createTransporter() {
  if (!env.MAIL_HOST || !env.MAIL_USER || !env.MAIL_PASSWORD) {
    throw new Error("Email is not configured. Set MAIL_HOST, MAIL_USER, and MAIL_PASSWORD.");
  }

  return nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_PORT === 465,
    auth: {
      user: env.MAIL_USER,
      pass: env.MAIL_PASSWORD,
    },
  });
}

function buildTextBody(data: WeeklyEmailData): string {
  const status = data.isOverBudget
    ? "You spent more than your weekly budget"
    : "You stayed within your weekly budget";

  return `Hello ${data.userName},

Your weekly report for "${data.pageTitle}" is ready.

Monthly budget: ${formatCurrency(data.monthlyBudget, data.currency)}
Weekly budget (monthly ÷ 4): ${formatCurrency(data.weeklyBudget, data.currency)}
Spent this week: ${formatCurrency(data.weekTotal, data.currency)}
Difference: ${formatCurrency(Math.abs(data.difference), data.currency)} ${
    data.isOverBudget ? "over" : "under"
  }
Status: ${status}

Summary:
${data.analysis}

---
Finance Tracker · automated weekly report
`;
}

function buildHtmlBody(data: WeeklyEmailData): string {
  const statusColor = data.isOverBudget ? "#dc2626" : "#16a34a";
  const statusText = data.isOverBudget ? "Over weekly budget" : "Within weekly budget";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: Inter, system-ui, sans-serif; background:#f1f5f9; margin:0; padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Weekly Report</p>
    <h1 style="margin:0 0 4px;font-size:22px;color:#0f172a;">${data.pageTitle}</h1>
    <p style="margin:0 0 24px;color:#64748b;">Hello <strong>${data.userName}</strong></p>

    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748b;">Monthly budget</td><td style="text-align:right;font-weight:600;">${formatCurrency(data.monthlyBudget, data.currency)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Weekly budget</td><td style="text-align:right;font-weight:600;">${formatCurrency(data.weeklyBudget, data.currency)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Spent this week</td><td style="text-align:right;font-weight:700;font-size:18px;color:${statusColor};">${formatCurrency(data.weekTotal, data.currency)}</td></tr>
      </table>
    </div>

    <p style="margin:0 0 16px;padding:12px 16px;border-radius:8px;background:${data.isOverBudget ? "#fef2f2" : "#f0fdf4"};color:${statusColor};font-weight:600;">${statusText}</p>

    <div style="white-space:pre-line;color:#334155;line-height:1.7;font-size:14px;">${data.analysis.replace(/\n/g, "<br>")}</div>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px;">
    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Finance Tracker · weekly report</p>
  </div>
</body>
</html>`;
}

export async function sendWeeklyReportEmail(
  to: string,
  data: WeeklyEmailData,
  pdfAttachment?: { filename: string; content: Buffer }
): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Finance Tracker" <${env.MAIL_USER}>`,
    to,
    subject: `Weekly report — ${data.pageTitle}`,
    text: buildTextBody(data),
    html: buildHtmlBody(data),
    attachments: pdfAttachment
      ? [
          {
            filename: pdfAttachment.filename,
            content: pdfAttachment.content,
            contentType: "application/pdf",
          },
        ]
      : undefined,
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(env.MAIL_HOST && env.MAIL_USER && env.MAIL_PASSWORD);
}
