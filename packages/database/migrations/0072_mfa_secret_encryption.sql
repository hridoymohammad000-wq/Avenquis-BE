ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mfa_secret_encrypted text;

COMMENT ON COLUMN user_profiles.mfa_secret_encrypted IS
  'Application-encrypted TOTP secret. Legacy mfa_secret is read only for one-time migration and must be cleared.';
