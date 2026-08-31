CREATE TABLE IF NOT EXISTS "client_document_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"request_title" varchar(255) NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"uploaded_file_url" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"working_paper_id" uuid NOT NULL,
	"author_membership_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"addressed_by_membership_id" uuid,
	"addressed_at" timestamp with time zone,
	"cleared_by_membership_id" uuid,
	"cleared_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "working_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"wp_code" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"section" varchar(100) NOT NULL,
	"file_url" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"prepared_by_membership_id" uuid,
	"prepared_at" timestamp with time zone,
	"reviewed_by_membership_id" uuid,
	"reviewed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_document_requests" ADD CONSTRAINT "client_document_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_document_requests" ADD CONSTRAINT "client_document_requests_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_working_paper_id_working_papers_id_fk" FOREIGN KEY ("working_paper_id") REFERENCES "public"."working_papers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_author_membership_id_memberships_id_fk" FOREIGN KEY ("author_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_addressed_by_membership_id_memberships_id_fk" FOREIGN KEY ("addressed_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_cleared_by_membership_id_memberships_id_fk" FOREIGN KEY ("cleared_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "working_papers" ADD CONSTRAINT "working_papers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "working_papers" ADD CONSTRAINT "working_papers_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "working_papers" ADD CONSTRAINT "working_papers_prepared_by_membership_id_memberships_id_fk" FOREIGN KEY ("prepared_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "working_papers" ADD CONSTRAINT "working_papers_reviewed_by_membership_id_memberships_id_fk" FOREIGN KEY ("reviewed_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "client_document_requests_tenant_id_idx" ON "client_document_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "client_document_requests_engagement_id_idx" ON "client_document_requests" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_notes_tenant_id_idx" ON "review_notes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_notes_working_paper_id_idx" ON "review_notes" USING btree ("working_paper_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "working_papers_tenant_eng_wp_code_idx" ON "working_papers" USING btree ("tenant_id","engagement_id","wp_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "working_papers_tenant_id_idx" ON "working_papers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "working_papers_engagement_id_idx" ON "working_papers" USING btree ("engagement_id");