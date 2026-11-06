CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email TEXT NOT NULL,
  name TEXT,
  image_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oidc_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Normalized email domain used to select this tenant.
  -- Example: example.com
  domain TEXT NOT NULL UNIQUE,

  -- Exact issuer identifier from the provider's OIDC configuration.
  issuer TEXT NOT NULL UNIQUE,

  -- Administrators control which providers are enabled.
  enabled BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT oidc_tenants_domain_lowercase
    CHECK (domain = LOWER(domain)),

  CONSTRAINT oidc_tenants_domain_not_empty
    CHECK (LENGTH(domain) > 0),

  CONSTRAINT oidc_tenants_issuer_not_empty
    CHECK (LENGTH(issuer) > 0)
);

CREATE TABLE IF NOT EXISTS oidc_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  -- OIDC identity is identified by the exact issuer and subject pair.
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,

  email TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT oidc_accounts_issuer_subject_unique
    UNIQUE (issuer, subject),

  CONSTRAINT oidc_accounts_subject_not_empty
    CHECK (LENGTH(subject) > 0),

  CONSTRAINT oidc_accounts_issuer_not_empty
    CHECK (LENGTH(issuer) > 0)
);

CREATE INDEX IF NOT EXISTS oidc_accounts_user_id_idx
  ON oidc_accounts(user_id);

CREATE INDEX IF NOT EXISTS oidc_accounts_email_idx
  ON oidc_accounts(LOWER(email));

CREATE INDEX IF NOT EXISTS oidc_tenants_enabled_domain_idx
  ON oidc_tenants(domain)
  WHERE enabled = TRUE;