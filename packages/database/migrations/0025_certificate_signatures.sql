ALTER TABLE "digital_certificates"
  ADD COLUMN IF NOT EXISTS "artifact_hash" varchar(64),
  ADD COLUMN IF NOT EXISTS "signature" text,
  ADD COLUMN IF NOT EXISTS "signature_algorithm" varchar(50),
  ADD COLUMN IF NOT EXISTS "signing_key_id" varchar(100);
