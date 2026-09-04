-- Phase 23 DVS remediation columns
ALTER TABLE "dvs_records" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "dvs_records" ADD COLUMN IF NOT EXISTS "provider" varchar(50) DEFAULT 'ICAB_DVS' NOT NULL;
ALTER TABLE "dvs_records" ADD COLUMN IF NOT EXISTS "is_authoritative" boolean DEFAULT false NOT NULL;
ALTER TABLE "dvs_records" ADD COLUMN IF NOT EXISTS "verification_status" varchar(50);
ALTER TABLE "dvs_records" ADD COLUMN IF NOT EXISTS "provider_reference" varchar(255);
ALTER TABLE "dvs_records" ADD COLUMN IF NOT EXISTS "failure_reason" varchar(500);
ALTER TABLE "dvs_records" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;
ALTER TABLE "dvs_records" ADD COLUMN IF NOT EXISTS "verified_by_membership_id" uuid REFERENCES "memberships"("id") ON DELETE SET NULL;
ALTER TABLE "dvs_records" ADD COLUMN IF NOT EXISTS "audit_evidence" jsonb;

-- Phase 24 Regulatory Filings remediation columns
ALTER TABLE "regulatory_filings" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "regulatory_filings" ADD COLUMN IF NOT EXISTS "submission_channel" varchar(50) DEFAULT 'MANUAL_SUBMISSION' NOT NULL;
ALTER TABLE "regulatory_filings" ADD COLUMN IF NOT EXISTS "provider_status" varchar(50) DEFAULT 'NOT_CONFIGURED' NOT NULL;
ALTER TABLE "regulatory_filings" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(100);
ALTER TABLE "regulatory_filings" ADD COLUMN IF NOT EXISTS "response_metadata" jsonb;
ALTER TABLE "regulatory_filings" ADD COLUMN IF NOT EXISTS "rejection_reason" varchar(500);
ALTER TABLE "regulatory_filings" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp with time zone;
ALTER TABLE "regulatory_filings" ADD COLUMN IF NOT EXISTS "last_attempt_at" timestamp with time zone;
ALTER TABLE "regulatory_filings" ADD COLUMN IF NOT EXISTS "prepared_by_membership_id" uuid REFERENCES "memberships"("id") ON DELETE SET NULL;
