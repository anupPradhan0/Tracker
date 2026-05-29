import type { Request, Response, NextFunction } from "express";
import { emailService } from "./email.service.js";
import { sendSuccess } from "../../common/utils/response.js";

export class EmailController {
  sendAiSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const period = (req.body.period as "WEEKLY" | "MONTHLY") ?? "MONTHLY";
      const result = await emailService.sendAiSummary(req.user!.userId, period);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  };

  logs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await emailService.getRecentLogs(req.user!.userId);
      sendSuccess(res, logs);
    } catch (e) {
      next(e);
    }
  };
}

export const emailController = new EmailController();
