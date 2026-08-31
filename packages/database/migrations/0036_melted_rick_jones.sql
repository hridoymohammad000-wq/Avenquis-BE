CREATE TABLE IF NOT EXISTS "audit_quality_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"question_text" text NOT NULL,
	"is_compliant" boolean DEFAULT false NOT NULL,
	"comments" text,
	"evaluated_by_membership_id" uuid,
	"evaluated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_quality_controls" ADD CONSTRAINT "audit_quality_controls_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_quality_controls" ADD CONSTRAINT "audit_quality_controls_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_quality_controls" ADD CONSTRAINT "audit_quality_controls_evaluated_by_membership_id_memberships_id_fk" FOREIGN KEY ("evaluated_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_qc_tenant_engagement_idx" ON "audit_quality_controls" USING btree ("tenant_id","engagement_id");