import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/app-error.js";

export class MailService {
  private getTransporter() {
    if (!env.MAIL_HOST || !env.MAIL_USER || !env.MAIL_PASSWORD) {
      throw AppError.internal("Email service is not configured");
    }
    return nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_PORT === 465,
      auth: { user: env.MAIL_USER, pass: env.MAIL_PASSWORD },
    });
  }

  async sendHtml(to: string, subject: string, html: string, from?: string) {
    const transporter = this.getTransporter();
    await transporter.sendMail({
      from: from ?? env.MAIL_FROM ?? env.MAIL_USER,
      to,
      subject,
      html,
    });
  }
}

export const mailService = new MailService();
