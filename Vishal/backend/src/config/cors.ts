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

/** Vite may use 5174+ when 5173 is taken; the dev proxy still forwards Origin. */
function isLocalDevOrigin(origin: string): boolean {
  if (env.NODE_ENV !== "development") {
    return false;
  }

  try {
    const { protocol, hostname } = new URL(origin);
    return (
      (protocol === "http:" || protocol === "https:") &&
      (hostname === "localhost" || hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Non-browser clients (curl, server-to-server) omit Origin.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin) || isLocalDevOrigin(origin)) {
      callback(null, origin);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
});
