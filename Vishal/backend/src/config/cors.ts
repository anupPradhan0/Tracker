import cors from "cors";
import { env } from "./env.js";

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>([env.CLIENT_URL]);

  if (env.NODE_ENV === "development") {
    const client = new URL(env.CLIENT_URL);
    if (client.hostname === "localhost") {
      origins.add(env.CLIENT_URL.replace("localhost", "127.0.0.1"));
    } else if (client.hostname === "127.0.0.1") {
      origins.add(env.CLIENT_URL.replace("127.0.0.1", "localhost"));
    }
  }

  return origins;
}

const allowedOrigins = buildAllowedOrigins();

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Non-browser clients (curl, server-to-server) omit Origin.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin)) {
      callback(null, origin);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
});
