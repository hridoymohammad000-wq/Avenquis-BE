ALTER TABLE "trial_balances"
  ALTER COLUMN "total_debit" TYPE numeric(20,2) USING "total_debit"::numeric,
  ALTER COLUMN "total_credit" TYPE numeric(20,2) USING "total_credit"::numeric;
--> statement-breakpoint
ALTER TABLE "tb_line_items"
  ALTER COLUMN "debit_amount" TYPE numeric(20,2) USING "debit_amount"::numeric,
  ALTER COLUMN "credit_amount" TYPE numeric(20,2) USING "credit_amount"::numeric,
  ALTER COLUMN "net_balance" TYPE numeric(20,2) USING "net_balance"::numeric,
  ALTER COLUMN "prior_year_balance" TYPE numeric(20,2) USING "prior_year_balance"::numeric;
--> statement-breakpoint
ALTER TABLE "feature_flags" DROP CONSTRAINT IF EXISTS "feature_flags_code_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_tenant_code_unique"
  ON "feature_flags" ("tenant_id", "code");
