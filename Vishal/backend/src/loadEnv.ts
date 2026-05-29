import { existsSync } from "fs";
import path from "path";
import { config } from "dotenv";

const localEnv = path.resolve(process.cwd(), ".env");
const monorepoEnv = path.resolve(process.cwd(), "backend", ".env");

if (existsSync(localEnv)) {
  config({ path: localEnv });
}
if (existsSync(monorepoEnv)) {
  config({ path: monorepoEnv, override: true });
}
