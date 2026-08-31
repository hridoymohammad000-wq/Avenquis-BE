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

export const env = _env.success
  ? _env.data
  : {
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/postgres",
      NODE_ENV:
        (process.env.NODE_ENV as "development" | "production" | "test") ||
        "development",
    };
