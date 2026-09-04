import { Request, Response, NextFunction } from "express";
import { db, authRateLimitBuckets, sql } from "@avenquis/database";
import { ApiError } from "../../errors/api-error.js";

export const rateLimitStore = {
  async consume(key: string, windowMs: number): Promise<number> {
    const result = await db.execute(sql`
      INSERT INTO auth_rate_limit_buckets
        ("key", window_started_at, count, expires_at, updated_at)
      VALUES
        (${key}, now(), 1, now() + (${windowMs} * interval '1 millisecond'), now())
      ON CONFLICT ("key") DO UPDATE SET
        count = CASE WHEN auth_rate_limit_buckets.expires_at <= now()
          THEN 1 ELSE auth_rate_limit_buckets.count + 1 END,
        window_started_at = CASE WHEN auth_rate_limit_buckets.expires_at <= now()
          THEN now() ELSE auth_rate_limit_buckets.window_started_at END,
        expires_at = CASE WHEN auth_rate_limit_buckets.expires_at <= now()
          THEN now() + (${windowMs} * interval '1 millisecond')
          ELSE auth_rate_limit_buckets.expires_at END,
        updated_at = now()
      RETURNING count
    `);
    return Number(result[0]?.count ?? 0);
  },
  async clear(): Promise<void> {
    await db.delete(authRateLimitBuckets);
  },
};

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  key: (req: Request) => string;
  store?: typeof rateLimitStore;
}) {
  const store = options.store ?? rateLimitStore;
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const count = await store.consume(options.key(req), options.windowMs);
      if (count > options.max) {
        return next(new ApiError(429, "Too many requests", "RATE_LIMITED"));
      }
      return next();
    } catch {
      return next(new ApiError(503, "Authentication protection unavailable", "RATE_LIMIT_UNAVAILABLE"));
    }
  };
}

function accountKey(req: Request): string {
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "anonymous";
  return `${req.ip}:${email}`;
}

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  key: accountKey,
});

export const mfaRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  key: (req) => `${req.ip}:${req.user?.id ?? "anonymous"}`,
});

export async function clearRateLimitBucketsForTests() {
  await rateLimitStore.clear();
}
