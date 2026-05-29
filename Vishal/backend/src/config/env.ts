import { existsSync } from "fs";
import path from "path";
import { config } from "dotenv";
import { z } from "zod";

function loadEnvFiles(): void {
  const localEnv = path.resolve(process.cwd(), ".env");
  const monorepoEnv = path.resolve(process.cwd(), "backend", ".env");

  if (existsSync(localEnv)) {
    config({ path: localEnv });
  }
  if (existsSync(monorepoEnv)) {
    config({ path: monorepoEnv, override: true });
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
