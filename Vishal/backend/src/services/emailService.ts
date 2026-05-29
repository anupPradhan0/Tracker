import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { formatCurrency } from "../utils/tracker.js";

export interface EmailStatus {
  configured: boolean;
  ready: boolean;
  hint?: string;
}

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

function isGmailHost(host: string): boolean {
  return host.includes("gmail.com") || host.includes("googlemail.com");
}

/** Gmail app passwords are 16 chars; users often paste them with spaces. */
export function normalizeMailPassword(password: string): string {
  return password.replace(/\s+/g, "");
}

const PLACEHOLDER_PASSWORDS = new Set([
  "...",
  "REPLACE_WITH_16_CHAR_APP_PASSWORD",
  "your-16-char-app-password",
  "xxxxxxxxxxxxxxxx",
]);

function isPlaceholderPassword(password: string): boolean {
  const normalized = normalizeMailPassword(password);
  return PLACEHOLDER_PASSWORDS.has(normalized);
}

function getMailAuth() {
  if (!env.MAIL_USER || !env.MAIL_PASSWORD) {
    return null;
  }
  return {
    user: env.MAIL_USER.trim(),
    pass: normalizeMailPassword(env.MAIL_PASSWORD),
  };
}

/** Soft hint for /email/status — does not block sending (Anurag-style: try SMTP on send). */
export function getEmailSetupHint(): string | undefined {
  const host = env.MAIL_HOST?.trim();
  const user = env.MAIL_USER?.trim();
  const rawPass = env.MAIL_PASSWORD?.trim();

  if (!host || !user) {
    return "Set MAIL_HOST, MAIL_USER, and MAIL_PASSWORD in backend/.env";
  }

  if (!rawPass || isPlaceholderPassword(rawPass)) {
    return (
      "Set MAIL_PASSWORD in backend/.env to your 16-character Gmail App Password " +
      "(Google Account → Security → App passwords)."
    );
  }

  const pass = normalizeMailPassword(rawPass);

  if (isGmailHost(host)) {
    if (pass.length < 16) {
      return (
        "Gmail needs a 16-character App Password (Google Account → Security → 2-Step Verification → App passwords). " +
        "Your normal Gmail password will not work."
      );
    }
    if (env.MAIL_USER && !env.MAIL_USER.toLowerCase().includes("@gmail.")) {
      return "For Gmail, MAIL_USER should be your full @gmail.com address.";
    }
  }

  return undefined;
}

function createTransporter() {
  const auth = getMailAuth();
  if (!auth) {
    throw new Error("Email is not configured. Set MAIL_HOST, MAIL_USER, and MAIL_PASSWORD.");
  }

  const host = env.MAIL_HOST?.trim();

  if (host && isGmailHost(host)) {
    return nodemailer.createTransport({
      service: "gmail",
      auth,
    });
  }

  if (!host) {
    throw new Error("MAIL_HOST is required for non-Gmail mail providers.");
  }

  return nodemailer.createTransport({
    host,
    port: env.MAIL_PORT,
    secure: env.MAIL_PORT === 465,
    auth,
  });
}

function getFromAddress(): string {
  const from = env.MAIL_FROM?.trim() || env.MAIL_USER;
  if (!from) {
    return '"Finance Tracker" <noreply@localhost>';
  }
  if (from.includes("<")) {
    return from;
  }
  return `"Finance Tracker" <${from}>`;
}

export function formatSmtpError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";

  if (code === "EAUTH" || code === "EENVELOPE") {
    const hint = getEmailSetupHint();
    if (hint) {
      return hint;
    }
    return (
      "Email login failed. For Gmail, use a 16-character App Password with 2-Step Verification enabled."
    );
  }

  if (code === "ECONNECTION" || code === "ETIMEDOUT" || code === "EDNS") {
    return "Could not reach the mail server. Check MAIL_HOST, MAIL_PORT, and your network.";
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return "Failed to send email. Check server mail settings.";
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
    from: getFromAddress(),
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

export function hasEmailSettings(): boolean {
  return Boolean(env.MAIL_HOST?.trim() && env.MAIL_USER?.trim());
}

export function isEmailConfigured(): boolean {
  const host = env.MAIL_HOST?.trim();
  const user = env.MAIL_USER?.trim();
  const pass = env.MAIL_PASSWORD?.trim();
  if (!host || !user || !pass) {
    return false;
  }
  if (isPlaceholderPassword(pass)) {
    return false;
  }
  return true;
}

export function getEmailStatus(): EmailStatus {
  const configured = hasEmailSettings();
  const canSend = isEmailConfigured();
  return {
    configured,
    ready: canSend,
  };
}

let verifyCache: { at: number; ready: boolean; hint?: string } | null = null;
const VERIFY_CACHE_MS = 5 * 60 * 1000;

/** Optional Nodemailer verify; cached briefly for /email/status. */
export async function verifySmtpConnection(): Promise<{ ready: boolean; hint?: string }> {
  if (!isEmailConfigured()) {
    return { ready: false, hint: getEmailSetupHint() };
  }

  const now = Date.now();
  if (verifyCache && now - verifyCache.at < VERIFY_CACHE_MS) {
    return { ready: verifyCache.ready, hint: verifyCache.hint };
  }

  try {
    await createTransporter().verify();
    verifyCache = { at: now, ready: true };
    return { ready: true, hint: getEmailSetupHint() };
  } catch (err) {
    const hint = formatSmtpError(err);
    verifyCache = { at: now, ready: false, hint };
    return { ready: false, hint };
  }
}
