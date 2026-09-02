CREATE TABLE IF NOT EXISTS "revoked_auth_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "revoked_auth_tokens_expires_at_idx"
  ON "revoked_auth_tokens" ("expires_at");

CREATE TABLE IF NOT EXISTS "auth_rate_limit_buckets" (
  "key" text PRIMARY KEY,
  "window_started_at" timestamp with time zone NOT NULL,
  "count" integer NOT NULL DEFAULT 0,
  "expires_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "auth_rate_limit_buckets_expires_at_idx"
  ON "auth_rate_limit_buckets" ("expires_at");
