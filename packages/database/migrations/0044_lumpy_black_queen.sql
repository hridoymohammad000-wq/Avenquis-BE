CREATE TABLE IF NOT EXISTS "tax_vat_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"workflow_type" varchar(50) NOT NULL,
	"period" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'data_collection' NOT NULL,
	"due_date" timestamp with time zone,
	"filed_date" timestamp with time zone,
	"assigned_to_membership_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_vat_workflows" ADD CONSTRAINT "tax_vat_workflows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_vat_workflows" ADD CONSTRAINT "tax_vat_workflows_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_vat_workflows" ADD CONSTRAINT "tax_vat_workflows_assigned_to_membership_id_memberships_id_fk" FOREIGN KEY ("assigned_to_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_vat_tenant_client_idx" ON "tax_vat_workflows" USING btree ("tenant_id","client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_vat_tenant_status_idx" ON "tax_vat_workflows" USING btree ("tenant_id","status");