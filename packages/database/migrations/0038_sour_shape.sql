CREATE TABLE IF NOT EXISTS "icab_exam_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"exam_session" varchar(100) NOT NULL,
	"level" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'applied' NOT NULL,
	"leave_requested_days" integer DEFAULT 0 NOT NULL,
	"leave_approved" boolean DEFAULT false NOT NULL,
	"approved_by_membership_id" uuid,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "icab_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"form_type" varchar(50) NOT NULL,
	"submission_date" timestamp with time zone,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"document_url" varchar(1024),
	"signed_by_principal_id" uuid,
	"signed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "icab_exam_registrations" ADD CONSTRAINT "icab_exam_registrations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "icab_exam_registrations" ADD CONSTRAINT "icab_exam_registrations_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "icab_exam_registrations" ADD CONSTRAINT "icab_exam_registrations_approved_by_membership_id_memberships_id_fk" FOREIGN KEY ("approved_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "icab_forms" ADD CONSTRAINT "icab_forms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "icab_forms" ADD CONSTRAINT "icab_forms_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "icab_forms" ADD CONSTRAINT "icab_forms_signed_by_principal_id_memberships_id_fk" FOREIGN KEY ("signed_by_principal_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "icab_exam_regs_tenant_student_idx" ON "icab_exam_registrations" USING btree ("tenant_id","student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "icab_forms_tenant_student_idx" ON "icab_forms" USING btree ("tenant_id","student_id");