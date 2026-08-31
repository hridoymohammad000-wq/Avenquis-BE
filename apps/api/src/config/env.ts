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
    .default("postgres://postgres:postgres@localhost:5432/avenquis_db"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
