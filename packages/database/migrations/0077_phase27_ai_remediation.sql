-- Phase 27 AI & Document Intelligence remediation columns
ALTER TABLE "ai_document_analyses" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "provider" varchar(50) DEFAULT 'GEMINI' NOT NULL;
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "model" varchar(100);
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "operation_type" varchar(50) DEFAULT 'document_analysis' NOT NULL;
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "prompt_version" varchar(50) DEFAULT 'v1' NOT NULL;
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(100);
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "confidence_score" numeric(5, 2);
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "failure_reason" varchar(500);
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "review_status" varchar(50) DEFAULT 'UNREVIEWED' NOT NULL;
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "reviewed_by_membership_id" uuid REFERENCES "memberships"("id") ON DELETE SET NULL;
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "human_corrections" jsonb;
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "usage_metadata" jsonb;
ALTER TABLE "ai_document_analyses" ADD COLUMN IF NOT EXISTS "audit_trail" jsonb;

ALTER TABLE "ai_engagement_reviews" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "provider" varchar(50) DEFAULT 'GEMINI' NOT NULL;
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "prompt_version" varchar(50) DEFAULT 'v1' NOT NULL;
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(100);
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "failure_reason" varchar(500);
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "review_status" varchar(50) DEFAULT 'UNREVIEWED' NOT NULL;
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "reviewed_by_membership_id" uuid REFERENCES "memberships"("id") ON DELETE SET NULL;
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "human_corrections" jsonb;
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "usage_metadata" jsonb;
ALTER TABLE "ai_engagement_reviews" ADD COLUMN IF NOT EXISTS "audit_trail" jsonb;
