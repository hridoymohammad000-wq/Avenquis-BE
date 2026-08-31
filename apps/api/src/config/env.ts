import { z } from "zod";

const DEV_JWT_SECRET = "dev-only-jwt-secret-change-me-32-bytes";
const DEV_REFRESH_SECRET = "dev-only-refresh-secret-change-me-32";
const DEV_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1h"),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  DATABASE_URL: z.string().url().refine((value) => value.startsWith("postgres"), "DATABASE_URL must use PostgreSQL"),
  SIGNING_PRIVATE_KEY: z.string().min(1).optional(),
  SIGNING_PUBLIC_KEY: z.string().min(1).optional(),
  SIGNING_KEY_ID: z.string().min(1).default("avenquis-ed25519-v1"),
});

export type ApiEnv = z.infer<typeof envSchema>;

function isPlaceholder(value: string): boolean {
  return value.includes("change-me") || value.includes("your-") || value.includes("placeholder");
}

export function parseEnv(source: NodeJS.ProcessEnv): ApiEnv {
  const nodeEnv = source.NODE_ENV ?? "development";
  const values = {
    ...source,
    NODE_ENV: nodeEnv,
    JWT_SECRET: source.JWT_SECRET ?? (nodeEnv === "production" ? undefined : DEV_JWT_SECRET),
    REFRESH_TOKEN_SECRET: source.REFRESH_TOKEN_SECRET ?? (nodeEnv === "production" ? undefined : DEV_REFRESH_SECRET),
    DATABASE_URL: source.DATABASE_URL ?? (nodeEnv === "production" ? undefined : DEV_DATABASE_URL),
  };
  const result = envSchema.safeParse(values);
  if (result.success && ((result.data.SIGNING_PRIVATE_KEY && !result.data.SIGNING_PUBLIC_KEY) || (!result.data.SIGNING_PRIVATE_KEY && result.data.SIGNING_PUBLIC_KEY))) {
    throw new Error("Invalid signing configuration: both signing keys are required together");
  }
  if (!result.success || (nodeEnv === "production" &&
      [values.JWT_SECRET, values.REFRESH_TOKEN_SECRET].some((value) => !value || isPlaceholder(value)))) {
    throw new Error("Invalid production configuration: JWT_SECRET, REFRESH_TOKEN_SECRET, and DATABASE_URL are required and must be valid");
  }
  return result.data;
}

export const env = parseEnv(process.env);
