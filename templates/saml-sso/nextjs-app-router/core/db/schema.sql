-- SAML SSO authentication schema
--
-- The application identifies an external SAML account using:
--   (idp_issuer, name_id)
--
-- Email is stored as a profile attribute. It is deliberately not used
-- as the identity key and is not unique, so accounts are never
-- automatically linked by matching email addresses.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT,
    name TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx
    ON users (LOWER(email))
    WHERE email IS NOT NULL;


CREATE TABLE IF NOT EXISTS saml_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users (id)
        ON DELETE CASCADE,

    idp_issuer TEXT NOT NULL,
    name_id TEXT NOT NULL,
    name_id_format TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT saml_accounts_idp_name_id_unique
        UNIQUE (idp_issuer, name_id)
);

CREATE INDEX IF NOT EXISTS saml_accounts_user_id_idx
    ON saml_accounts (user_id);

CREATE INDEX IF NOT EXISTS saml_accounts_idp_issuer_idx
    ON saml_accounts (idp_issuer);