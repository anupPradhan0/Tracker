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

/** Extract email from MAIL_FROM: `"Name" <a@b.com>`, `a@b.com`, or undefined if name-only. */
export function extractFromEmail(mailFrom: string | undefined): string | undefined {
  if (!mailFrom?.trim()) {
    return undefined;
  }
  const trimmed = mailFrom.trim();
  const angleMatch = trimmed.match(/<([^>]+)>/);
  if (angleMatch?.[1]) {
    return angleMatch[1].trim().toLowerCase();
  }
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  return undefined;
}

function extractDisplayNameFromMailFrom(mailFrom: string | undefined): string | undefined {
  if (!mailFrom?.trim()) {
    return undefined;
  }
  const trimmed = mailFrom.trim();
  const quotedMatch = trimmed.match(/^"([^"]+)"/);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }
  if (trimmed.includes("<")) {
    const before = trimmed.split("<")[0]?.trim();
    if (before && !before.includes("@")) {
      return before.replace(/^"|"$/g, "");
    }
  }
  if (!trimmed.includes("@")) {
    return trimmed;
  }
  return undefined;
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) {
    return "***";
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const maskedLocal = local.length <= 2 ? "**" : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

function getMailUserFromMismatchHint(): string | undefined {
  const host = env.MAIL_HOST?.trim();
  const user = env.MAIL_USER?.trim();
  if (!host || !user || !isGmailHost(host)) {
    return undefined;
  }

  const fromEmail = extractFromEmail(env.MAIL_FROM);
  if (!fromEmail || fromEmail === user.toLowerCase()) {
    return undefined;
  }

  return (
    `MAIL_USER (${maskEmail(user)}) must be the Gmail account that created the App Password. ` +
    `MAIL_FROM uses a different address (${maskEmail(fromEmail)}) — set MAIL_USER to match, or remove the email from MAIL_FROM.`
  );
}

export function getMailAddressDiagnostics(): {
  mailUser: string;
  mailFromEmail?: string;
  addressesMatch: boolean;
} | null {
  const user = env.MAIL_USER?.trim();
  if (!user) {
    return null;
  }
  const fromEmail = extractFromEmail(env.MAIL_FROM);
  return {
    mailUser: maskEmail(user),
    mailFromEmail: fromEmail ? maskEmail(fromEmail) : undefined,
    addressesMatch: !fromEmail || fromEmail === user.toLowerCase(),
  };
}

/** Log a startup warning when Gmail MAIL_FROM email differs from MAIL_USER. */
export function warnEmailConfigOnStartup(): void {
  const hint = getMailUserFromMismatchHint();
  if (hint) {
    console.warn(`[email] ${hint}`);
  }
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

    const mismatchHint = getMailUserFromMismatchHint();
    if (mismatchHint) {
      return mismatchHint;
    }
  }

  return undefined;
}

function createTransporter() {
  const auth = getMailAuth();
  if (!auth) {
    throw new Error("Email is not configured. Set MAIL_HOST, MAIL_USER, and MAIL_PASSWORD.");
  }

  const host = env.MAIL_HOST?.trim() || "smtp.gmail.com";
  const port = env.MAIL_PORT;
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth,
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  });
}

function getFromAddress(): string {
  const user = env.MAIL_USER?.trim();
  const host = env.MAIL_HOST?.trim() || "smtp.gmail.com";

  // Gmail: SMTP auth and From must use the same Google account (Anup-style).
  if (user && isGmailHost(host)) {
    const displayName = extractDisplayNameFromMailFrom(env.MAIL_FROM) ?? "Finance Tracker";
    return `"${displayName}" <${user}>`;
  }

  const from = env.MAIL_FROM?.trim() || env.MAIL_USER;
  if (!from) {
    return '"Finance Tracker" <noreply@localhost>';
  }
  if (from.includes("<")) {
    return from;
  }
  return `"Finance Tracker" <${from}>`;
}

function getSmtpErrorCode(err: unknown): string {
  if (!err || typeof err !== "object") {
    return "";
  }
  const record = err as { code?: string; responseCode?: number };
  if (record.code) {
    return String(record.code);
  }
  if (record.responseCode === 535) {
    return "EAUTH";
  }
  return "";
}

export function formatSmtpError(err: unknown): string {
  const code = getSmtpErrorCode(err);
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  const isAuthFailure =
    code === "EAUTH" ||
    code === "EENVELOPE" ||
    /535|username and password not accepted|invalid login/i.test(message);

  if (isAuthFailure) {
    const hint = getEmailSetupHint() ?? getMailUserFromMismatchHint();
    if (hint) {
      return hint;
    }
    let message =
      "Gmail rejected the login. Use a 16-character App Password for the same address as MAIL_USER " +
      "(Google Account → Security → App passwords), then restart the backend.";
    if (env.NODE_ENV === "development" && env.MAIL_USER?.trim()) {
      message += ` (SMTP 535 for MAIL_USER=${maskEmail(env.MAIL_USER.trim())})`;
    }
    return message;
  }

  if (
    code === "ECONNECTION" ||
    code === "ETIMEDOUT" ||
    code === "EDNS" ||
    code === "ESOCKET" ||
    code === "ENOTFOUND" ||
    /getaddrinfo|could not connect|connection closed/i.test(message)
  ) {
    return (
      `Could not reach ${env.MAIL_HOST ?? "smtp.gmail.com"} on port ${env.MAIL_PORT}. ` +
      "Check your internet, firewall/VPN, and that MAIL_HOST=smtp.gmail.com and MAIL_PORT=587."
    );
  }

  if (message) {
    return message;
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

The attached PDF includes your full weekly report: budget overview, spending by day and category, insights, and the complete expense log.

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

    <p style="margin:20px 0 0;font-size:13px;color:#64748b;line-height:1.6;">The attached PDF includes your full weekly report: budget overview, spending by day and category, insights, and the complete expense log.</p>

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
