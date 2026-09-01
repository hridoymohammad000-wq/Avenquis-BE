import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../errors/api-error.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  key: (req: Request) => string;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = options.key(req);
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + options.windowMs }
      : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > options.max) {
      return next(new ApiError(429, "Too many requests", "RATE_LIMITED"));
    }
    return next();
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

export function clearRateLimitBucketsForTests() {
  buckets.clear();
}
