CREATE TABLE IF NOT EXISTS "audit_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"engagement_id" uuid,
	"file_type" varchar(20) NOT NULL,
	"category" varchar(100) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" varchar(1024) NOT NULL,
	"description" text,
	"uploaded_by_membership_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_files" ADD CONSTRAINT "audit_files_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_files" ADD CONSTRAINT "audit_files_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_files" ADD CONSTRAINT "audit_files_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_files" ADD CONSTRAINT "audit_files_uploaded_by_membership_id_memberships_id_fk" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_files_tenant_client_idx" ON "audit_files" USING btree ("tenant_id","client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_files_tenant_engagement_idx" ON "audit_files" USING btree ("tenant_id","engagement_id");