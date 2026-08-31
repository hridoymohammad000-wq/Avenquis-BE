CREATE TABLE IF NOT EXISTS "audit_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"procedure_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_url" varchar(1024) NOT NULL,
	"reference_code" varchar(100),
	"description" text,
	"uploaded_by_membership_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"procedure_id" uuid NOT NULL,
	"population_size" integer NOT NULL,
	"sample_size" integer NOT NULL,
	"selection_method" varchar(50) NOT NULL,
	"confidence_level_pct" integer DEFAULT 9500 NOT NULL,
	"tolerable_error_pct" integer DEFAULT 500 NOT NULL,
	"status" varchar(50) DEFAULT 'planned' NOT NULL,
	"created_by_membership_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_evidence" ADD CONSTRAINT "audit_evidence_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_evidence" ADD CONSTRAINT "audit_evidence_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_evidence" ADD CONSTRAINT "audit_evidence_procedure_id_audit_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."audit_procedures"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_evidence" ADD CONSTRAINT "audit_evidence_uploaded_by_membership_id_memberships_id_fk" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_samples" ADD CONSTRAINT "audit_samples_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_samples" ADD CONSTRAINT "audit_samples_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_samples" ADD CONSTRAINT "audit_samples_procedure_id_audit_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."audit_procedures"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_samples" ADD CONSTRAINT "audit_samples_created_by_membership_id_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_evidence_tenant_engagement_idx" ON "audit_evidence" USING btree ("tenant_id","engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_evidence_tenant_procedure_idx" ON "audit_evidence" USING btree ("tenant_id","procedure_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_samples_tenant_engagement_idx" ON "audit_samples" USING btree ("tenant_id","engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_samples_tenant_procedure_idx" ON "audit_samples" USING btree ("tenant_id","procedure_id");