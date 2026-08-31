CREATE TABLE IF NOT EXISTS "audit_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"procedure_id" uuid,
	"exception_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"financial_impact" integer DEFAULT 0 NOT NULL,
	"resolution_status" varchar(50) DEFAULT 'open' NOT NULL,
	"raised_by_membership_id" uuid NOT NULL,
	"resolved_by_membership_id" uuid,
	"management_response" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"review_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'in_progress' NOT NULL,
	"findings" text,
	"reviewer_membership_id" uuid NOT NULL,
	"signed_off_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_exceptions" ADD CONSTRAINT "audit_exceptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_exceptions" ADD CONSTRAINT "audit_exceptions_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_exceptions" ADD CONSTRAINT "audit_exceptions_procedure_id_audit_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."audit_procedures"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_exceptions" ADD CONSTRAINT "audit_exceptions_raised_by_membership_id_memberships_id_fk" FOREIGN KEY ("raised_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_exceptions" ADD CONSTRAINT "audit_exceptions_resolved_by_membership_id_memberships_id_fk" FOREIGN KEY ("resolved_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_reviews" ADD CONSTRAINT "audit_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_reviews" ADD CONSTRAINT "audit_reviews_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_reviews" ADD CONSTRAINT "audit_reviews_reviewer_membership_id_memberships_id_fk" FOREIGN KEY ("reviewer_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_exceptions_tenant_engagement_idx" ON "audit_exceptions" USING btree ("tenant_id","engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_exceptions_tenant_status_idx" ON "audit_exceptions" USING btree ("tenant_id","resolution_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_reviews_tenant_engagement_idx" ON "audit_reviews" USING btree ("tenant_id","engagement_id");