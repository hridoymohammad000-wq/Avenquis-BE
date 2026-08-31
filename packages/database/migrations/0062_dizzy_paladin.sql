CREATE TABLE IF NOT EXISTS "global_countries" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"calling_code" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_regional_settings" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"date_format" varchar(20) DEFAULT 'YYYY-MM-DD' NOT NULL,
	"financial_year_start_month" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_regional_settings" ADD CONSTRAINT "tenant_regional_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_regional_settings" ADD CONSTRAINT "tenant_regional_settings_country_code_global_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."global_countries"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
