CREATE TABLE IF NOT EXISTS "audit_completion_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL,
	"item" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_by_membership_id" uuid,
	"completed_at" timestamp with time zone,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"opinion_text" text NOT NULL,
	"basis_for_opinion" text,
	"emphasis_of_matter" text,
	"key_audit_matters" text,
	"other_information" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"drafted_by_membership_id" uuid NOT NULL,
	"signed_by_membership_id" uuid,
	"signed_at" timestamp with time zone,
	"issue_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_reports_engagement_id_unique" UNIQUE("engagement_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_completion_checklists" ADD CONSTRAINT "audit_completion_checklists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_completion_checklists" ADD CONSTRAINT "audit_completion_checklists_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_completion_checklists" ADD CONSTRAINT "audit_completion_checklists_completed_by_membership_id_memberships_id_fk" FOREIGN KEY ("completed_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_drafted_by_membership_id_memberships_id_fk" FOREIGN KEY ("drafted_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_signed_by_membership_id_memberships_id_fk" FOREIGN KEY ("signed_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_completion_checklists_tenant_engagement_idx" ON "audit_completion_checklists" USING btree ("tenant_id","engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_reports_tenant_engagement_idx" ON "audit_reports" USING btree ("tenant_id","engagement_id");