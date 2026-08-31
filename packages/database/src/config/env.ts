import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/postgres"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌ Invalid database environment variables:",
    _env.error.format(),
  );
  process.exit(1);
}

export const env = _env.data;
