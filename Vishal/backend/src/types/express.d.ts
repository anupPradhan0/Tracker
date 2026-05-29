import type { JwtPayload } from "./api.js";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      id: string;
    }
  }
}

export {};
