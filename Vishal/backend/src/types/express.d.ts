import type { JwtPayload } from "./api.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: string };
    }
  }
}

export {};
