CREATE TABLE IF NOT EXISTS "activity_feed_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor_membership_id" uuid NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recipient_membership_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(100) NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_feed_events" ADD CONSTRAINT "activity_feed_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_feed_events" ADD CONSTRAINT "activity_feed_events_actor_membership_id_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_membership_id_memberships_id_fk" FOREIGN KEY ("recipient_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_feed_events_tenant_entity_type_entity_id_idx" ON "activity_feed_events" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_feed_events_tenant_id_idx" ON "activity_feed_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_tenant_recipient_is_read_idx" ON "notifications" USING btree ("tenant_id","recipient_membership_id","is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_tenant_id_idx" ON "notifications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_recipient_membership_id_idx" ON "notifications" USING btree ("recipient_membership_id");