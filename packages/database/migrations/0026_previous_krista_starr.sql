CREATE TABLE IF NOT EXISTS "audit_procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"risk_assessment_id" uuid,
	"assertion" varchar(100),
	"procedure_text" text NOT NULL,
	"procedure_type" varchar(50) DEFAULT 'substantive' NOT NULL,
	"status" varchar(50) DEFAULT 'not_started' NOT NULL,
	"assigned_to_membership_id" uuid,
	"work_paper_reference" varchar(255),
	"results" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"prepared_by_membership_id" uuid NOT NULL,
	"reviewed_by_membership_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "digital_certificates" ADD COLUMN "artifact_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "digital_certificates" ADD COLUMN "signature" text;--> statement-breakpoint
ALTER TABLE "digital_certificates" ADD COLUMN "signature_algorithm" varchar(50);--> statement-breakpoint
ALTER TABLE "digital_certificates" ADD COLUMN "signing_key_id" varchar(100);--> statement-breakpoint
ALTER TABLE "signoff_audit_logs" ADD COLUMN "artifact_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "signoff_audit_logs" ADD COLUMN "signature" text;--> statement-breakpoint
ALTER TABLE "signoff_audit_logs" ADD COLUMN "signature_algorithm" varchar(50);--> statement-breakpoint
ALTER TABLE "signoff_audit_logs" ADD COLUMN "signing_key_id" varchar(100);--> statement-breakpoint
ALTER TABLE "signoff_audit_logs" ADD COLUMN "previous_record_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "signoff_audit_logs" ADD COLUMN "record_hash" varchar(64);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_procedures" ADD CONSTRAINT "audit_procedures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_procedures" ADD CONSTRAINT "audit_procedures_program_id_audit_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."audit_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_procedures" ADD CONSTRAINT "audit_procedures_risk_assessment_id_risk_assessments_id_fk" FOREIGN KEY ("risk_assessment_id") REFERENCES "public"."risk_assessments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_procedures" ADD CONSTRAINT "audit_procedures_assigned_to_membership_id_memberships_id_fk" FOREIGN KEY ("assigned_to_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_programs" ADD CONSTRAINT "audit_programs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_programs" ADD CONSTRAINT "audit_programs_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_programs" ADD CONSTRAINT "audit_programs_prepared_by_membership_id_memberships_id_fk" FOREIGN KEY ("prepared_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_programs" ADD CONSTRAINT "audit_programs_reviewed_by_membership_id_memberships_id_fk" FOREIGN KEY ("reviewed_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_procedures_tenant_program_idx" ON "audit_procedures" USING btree ("tenant_id","program_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_procedures_tenant_risk_idx" ON "audit_procedures" USING btree ("tenant_id","risk_assessment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_programs_tenant_engagement_idx" ON "audit_programs" USING btree ("tenant_id","engagement_id");