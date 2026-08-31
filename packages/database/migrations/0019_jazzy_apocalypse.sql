CREATE TABLE IF NOT EXISTS "tb_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"trial_balance_id" uuid NOT NULL,
	"account_code" varchar(50) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"debit_amount" integer DEFAULT 0 NOT NULL,
	"credit_amount" integer DEFAULT 0 NOT NULL,
	"net_balance" integer NOT NULL,
	"prior_year_balance" integer DEFAULT 0,
	"mapped_fs_group" varchar(100),
	"mapped_lead_schedule" varchar(100),
	"is_mapped" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trial_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"as_of_date" timestamp with time zone NOT NULL,
	"currency" varchar(10) DEFAULT 'BDT' NOT NULL,
	"total_debit" integer NOT NULL,
	"total_credit" integer NOT NULL,
	"is_balanced" boolean DEFAULT true NOT NULL,
	"uploaded_by_membership_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tb_line_items" ADD CONSTRAINT "tb_line_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tb_line_items" ADD CONSTRAINT "tb_line_items_trial_balance_id_trial_balances_id_fk" FOREIGN KEY ("trial_balance_id") REFERENCES "public"."trial_balances"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trial_balances" ADD CONSTRAINT "trial_balances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trial_balances" ADD CONSTRAINT "trial_balances_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trial_balances" ADD CONSTRAINT "trial_balances_uploaded_by_membership_id_memberships_id_fk" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tb_line_items_tenant_tb_idx" ON "tb_line_items" USING btree ("tenant_id","trial_balance_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tb_line_items_tenant_lead_schedule_idx" ON "tb_line_items" USING btree ("tenant_id","mapped_lead_schedule");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trial_balances_tenant_id_idx" ON "trial_balances" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trial_balances_engagement_id_idx" ON "trial_balances" USING btree ("engagement_id");