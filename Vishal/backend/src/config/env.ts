import { existsSync } from "fs";
import path from "path";
import { config } from "dotenv";
import { z } from "zod";

function findBackendEnvPath(): string | undefined {
  const seen = new Set<string>();
  const tryPath = (candidate: string): string | undefined => {
    const resolved = path.resolve(candidate);
    if (seen.has(resolved) || !existsSync(resolved)) {
      return undefined;
    }
    seen.add(resolved);
    return resolved;
  };

  const roots = new Set<string>([process.cwd()]);
  if (process.env.INIT_CWD) {
    roots.add(process.env.INIT_CWD);
  }

  for (const root of roots) {
    const hit =
      tryPath(path.join(root, "backend", ".env")) ??
      tryPath(path.join(root, "Vishal", "backend", ".env")) ??
      tryPath(path.join(root, ".env"));
    if (hit) {
      return hit;
    }
  }

  return undefined;
}

function loadEnvFiles(): void {
  const backendEnv = findBackendEnvPath();
  if (backendEnv) {
    config({ path: backendEnv });
  }
}

loadEnvFiles();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_NAME: z.string().default("auth_token"),
  COOKIE_SECRET: z.string().min(32),
  CLIENT_URL: z.string().url(),
  SERVER_URL: z.string().url().optional(),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  COHERE_API_KEY: z.string().optional(),
  COHERE_MODEL: z.string().default("command-r-plus-08-2024"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
