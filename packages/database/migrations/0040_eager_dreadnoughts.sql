CREATE TABLE IF NOT EXISTS "dvs_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"dvs_code" varchar(50) NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'generated' NOT NULL,
	"generated_by_membership_id" uuid,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dvs_records_dvs_code_unique" UNIQUE("dvs_code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dvs_records" ADD CONSTRAINT "dvs_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dvs_records" ADD CONSTRAINT "dvs_records_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dvs_records" ADD CONSTRAINT "dvs_records_generated_by_membership_id_memberships_id_fk" FOREIGN KEY ("generated_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dvs_records_tenant_engagement_idx" ON "dvs_records" USING btree ("tenant_id","engagement_id");