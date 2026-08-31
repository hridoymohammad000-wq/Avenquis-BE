ALTER TABLE "signoff_audit_logs"
  ADD COLUMN IF NOT EXISTS "artifact_hash" varchar(64),
  ADD COLUMN IF NOT EXISTS "signature" text,
  ADD COLUMN IF NOT EXISTS "signature_algorithm" varchar(50),
  ADD COLUMN IF NOT EXISTS "signing_key_id" varchar(100),
  ADD COLUMN IF NOT EXISTS "previous_record_hash" varchar(64),
  ADD COLUMN IF NOT EXISTS "record_hash" varchar(64);

CREATE OR REPLACE FUNCTION app.reject_signoff_history_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'signoff audit history is append-only';
END;
$$;

DROP TRIGGER IF EXISTS signoff_audit_logs_append_only ON signoff_audit_logs;
CREATE TRIGGER signoff_audit_logs_append_only
BEFORE UPDATE OR DELETE ON signoff_audit_logs
FOR EACH ROW EXECUTE FUNCTION app.reject_signoff_history_mutation();
