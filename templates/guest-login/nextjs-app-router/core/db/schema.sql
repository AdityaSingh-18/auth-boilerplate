CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Minimal user table.
-- Adapt this table to your application's existing user model if needed.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_guest BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores verified identities linked to a user.
-- Examples:
--   provider = 'google', provider_account_id = Google's stable account ID
--   provider = 'github', provider_account_id = GitHub's stable account ID
--   provider = 'email', provider_account_id = normalized email address
--
-- Only trusted server-side authentication flows should create verified identities.
CREATE TABLE IF NOT EXISTS auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,

  email TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT auth_identities_provider_not_empty
    CHECK (LENGTH(TRIM(provider)) > 0),

  CONSTRAINT auth_identities_account_id_not_empty
    CHECK (LENGTH(TRIM(provider_account_id)) > 0),

  CONSTRAINT auth_identities_provider_account_unique
    UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx
  ON auth_identities(user_id);

CREATE INDEX IF NOT EXISTS auth_identities_email_idx
  ON auth_identities(LOWER(email))
  WHERE email IS NOT NULL;