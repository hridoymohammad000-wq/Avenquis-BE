CREATE TABLE IF NOT EXISTS "digital_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"certificate_number" varchar(50) NOT NULL,
	"certificate_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"audit_opinion" varchar(50) NOT NULL,
	"summary_opinion_text" text NOT NULL,
	"digital_seal_hash" varchar(255) NOT NULL,
	"signed_by_membership_id" uuid NOT NULL,
	"signed_at" timestamp with time zone NOT NULL,
	"verification_token" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'issued' NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signoff_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"signer_membership_id" uuid NOT NULL,
	"signoff_role" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"comments" text,
	"signed_hash" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_signed_by_membership_id_memberships_id_fk" FOREIGN KEY ("signed_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "signoff_audit_logs" ADD CONSTRAINT "signoff_audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "signoff_audit_logs" ADD CONSTRAINT "signoff_audit_logs_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "signoff_audit_logs" ADD CONSTRAINT "signoff_audit_logs_signer_membership_id_memberships_id_fk" FOREIGN KEY ("signer_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "digital_certificates_tenant_cert_number_idx" ON "digital_certificates" USING btree ("tenant_id","certificate_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "digital_certificates_verification_token_idx" ON "digital_certificates" USING btree ("verification_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "digital_certificates_tenant_id_idx" ON "digital_certificates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "digital_certificates_engagement_id_idx" ON "digital_certificates" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signoff_audit_logs_tenant_id_idx" ON "signoff_audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signoff_audit_logs_engagement_id_idx" ON "signoff_audit_logs" USING btree ("engagement_id");