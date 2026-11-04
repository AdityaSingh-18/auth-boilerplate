CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email TEXT,
  name TEXT,
  image_url TEXT,

  email_verified BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
ON users (LOWER(email))
WHERE email IS NOT NULL;


CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  provider_tenant_id TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT oauth_accounts_provider_identity_unique
    UNIQUE (provider, provider_tenant_id, provider_account_id)
);

CREATE INDEX IF NOT EXISTS oauth_accounts_user_id_idx
ON oauth_accounts (user_id);