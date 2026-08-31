import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  JWT_SECRET: z
    .string()
    .default("avenquis_jwt_super_secret_key_production_grade_32_chars"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .default("avenquis_refresh_super_secret_key_production_grade_32"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/postgres"),
});

const _env = envSchema.safeParse(process.env);

export const env = _env.success
  ? _env.data
  : {
      PORT: Number(process.env.PORT) || 3000,
      NODE_ENV:
        (process.env.NODE_ENV as "development" | "production" | "test") ||
        "development",
      JWT_SECRET:
        process.env.JWT_SECRET ||
        "avenquis_jwt_super_secret_key_production_grade_32_chars",
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
      REFRESH_TOKEN_SECRET:
        process.env.REFRESH_TOKEN_SECRET ||
        "avenquis_refresh_super_secret_key_production_grade_32",
      REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/postgres",
    };
