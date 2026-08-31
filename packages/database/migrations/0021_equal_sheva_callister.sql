CREATE TABLE IF NOT EXISTS "materiality_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"benchmark" varchar(100) NOT NULL,
	"benchmark_amount" integer NOT NULL,
	"percentage_applied" integer NOT NULL,
	"overall_materiality" integer NOT NULL,
	"performance_materiality_pct" integer DEFAULT 7500 NOT NULL,
	"performance_materiality" integer NOT NULL,
	"clearly_trivial_pct" integer DEFAULT 500 NOT NULL,
	"clearly_trivial_threshold" integer NOT NULL,
	"rationale" text,
	"assessed_by_membership_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"line_item_id" uuid,
	"area_name" varchar(255) NOT NULL,
	"assertion" varchar(100) NOT NULL,
	"inherent_risk" varchar(20) DEFAULT 'medium' NOT NULL,
	"control_risk" varchar(20) DEFAULT 'medium' NOT NULL,
	"combined_risk_level" varchar(20) NOT NULL,
	"detection_risk_required" varchar(20) NOT NULL,
	"risk_description" text,
	"response_strategy" text,
	"assessed_by_membership_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "materiality_assessments" ADD CONSTRAINT "materiality_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "materiality_assessments" ADD CONSTRAINT "materiality_assessments_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "materiality_assessments" ADD CONSTRAINT "materiality_assessments_assessed_by_membership_id_memberships_id_fk" FOREIGN KEY ("assessed_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_line_item_id_tb_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."tb_line_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_assessed_by_membership_id_memberships_id_fk" FOREIGN KEY ("assessed_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "materiality_tenant_engagement_idx" ON "materiality_assessments" USING btree ("tenant_id","engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "risk_assessments_tenant_engagement_idx" ON "risk_assessments" USING btree ("tenant_id","engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "risk_assessments_tenant_assertion_idx" ON "risk_assessments" USING btree ("tenant_id","assertion");