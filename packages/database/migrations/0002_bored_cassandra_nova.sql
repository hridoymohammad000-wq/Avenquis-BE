ALTER TABLE "user_profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "mfa_secret" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "mfa_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "mfa_backup_codes" jsonb;