import { z } from "zod";
import "dotenv/config";

const DEV_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/postgres";
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (value) => value.startsWith("postgres"),
      "DATABASE_URL must use PostgreSQL",
    ),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_SSL_CA: z.string().min(1).optional(),
});

export type DatabaseEnv = z.infer<typeof envSchema>;

export function parseDatabaseEnv(source: NodeJS.ProcessEnv): DatabaseEnv {
  const nodeEnv = source.NODE_ENV ?? "development";
  const databaseUrl =
    source.DATABASE_URL ??
    (nodeEnv === "production" ? undefined : DEV_DATABASE_URL);
  const result = envSchema.safeParse({
    ...source,
    NODE_ENV: nodeEnv,
    DATABASE_URL: databaseUrl,
  });
  if (
    !result.success ||
    (nodeEnv === "production" &&
      databaseUrl &&
      /USER|PASSWORD|HOST|DATABASE/.test(databaseUrl))
  ) {
    throw new Error(
      "Invalid database configuration: DATABASE_URL is required and must be a valid PostgreSQL URL",
    );
  }
  return result.data;
}

export const env = parseDatabaseEnv(process.env);
