CREATE TABLE IF NOT EXISTS "engagement_independence_declarations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"declaration_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"has_financial_interest" boolean DEFAULT false NOT NULL,
	"has_personal_relationship" boolean DEFAULT false NOT NULL,
	"remarks" text,
	"cleared_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "engagement_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"role" varchar(100) NOT NULL,
	"allocated_hours" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "engagements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"engagement_code" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"engagement_type" varchar(100) NOT NULL,
	"financial_year" varchar(50) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"budgeted_hours" integer DEFAULT 0 NOT NULL,
	"budgeted_fee" integer DEFAULT 0 NOT NULL,
	"currency" varchar(10) DEFAULT 'BDT' NOT NULL,
	"status" varchar(50) DEFAULT 'planning' NOT NULL,
	"engagement_partner_membership_id" uuid,
	"engagement_manager_membership_id" uuid,
	"audit_quality_reviewer_membership_id" uuid,
	"independence_cleared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagement_independence_declarations" ADD CONSTRAINT "engagement_independence_declarations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagement_independence_declarations" ADD CONSTRAINT "engagement_independence_declarations_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagement_independence_declarations" ADD CONSTRAINT "engagement_independence_declarations_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagement_team_members" ADD CONSTRAINT "engagement_team_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagement_team_members" ADD CONSTRAINT "engagement_team_members_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagement_team_members" ADD CONSTRAINT "engagement_team_members_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_engagement_partner_membership_id_memberships_id_fk" FOREIGN KEY ("engagement_partner_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_engagement_manager_membership_id_memberships_id_fk" FOREIGN KEY ("engagement_manager_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "engagements" ADD CONSTRAINT "engagements_audit_quality_reviewer_membership_id_memberships_id_fk" FOREIGN KEY ("audit_quality_reviewer_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagement_independence_declarations_tenant_id_idx" ON "engagement_independence_declarations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagement_independence_declarations_engagement_id_idx" ON "engagement_independence_declarations" USING btree ("engagement_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "engagement_team_members_tenant_eng_member_idx" ON "engagement_team_members" USING btree ("tenant_id","engagement_id","membership_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagement_team_members_tenant_id_idx" ON "engagement_team_members" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagement_team_members_engagement_id_idx" ON "engagement_team_members" USING btree ("engagement_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "engagements_tenant_engagement_code_idx" ON "engagements" USING btree ("tenant_id","engagement_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagements_tenant_id_idx" ON "engagements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "engagements_client_id_idx" ON "engagements" USING btree ("client_id");