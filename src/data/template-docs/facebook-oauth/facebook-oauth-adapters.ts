import type { DatabaseAdapterExample } from "@/types/auth";

export const facebookOAuthAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon PostgreSQL",
    description:
      "The implemented database adapter. Stores application users and Facebook OAuth account relationships in PostgreSQL.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup: `CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  name TEXT,
  image_url TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users (LOWER(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS oauth_accounts_user_id_idx
  ON oauth_accounts(user_id);`,
    code: `import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function findFacebookUser(
  facebookUserId: string,
) {
  const rows = await sql\`
    SELECT users.*
    FROM users
    INNER JOIN oauth_accounts
      ON oauth_accounts.user_id = users.id
    WHERE oauth_accounts.provider = 'facebook'
      AND oauth_accounts.provider_account_id = \${facebookUserId}
    LIMIT 1
  \`;

  return rows[0] ?? null;
}`,
    implemented: true,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description:
      "Illustrative alternative using MongoDB collections for application users and linked OAuth accounts.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    setup: `Create two collections:

users
- _id
- email
- name
- image_url
- email_verified
- created_at
- updated_at

oauth_accounts
- _id
- user_id
- provider
- provider_account_id
- created_at

Create a unique index on:
(provider, provider_account_id)

Create a partial unique index on normalized user email when email is present.`,
    code: `const accounts = db.collection("oauth_accounts");

const account = await accounts.findOne({
  provider: "facebook",
  provider_account_id: facebookUserId,
});

if (account) {
  const user = await db.collection("users").findOne({
    _id: account.user_id,
  });
}`,
    implemented: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Illustrative alternative using MySQL tables for application users and OAuth account relationships.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup: `Create two tables:

users
- id
- email
- name
- image_url
- email_verified
- created_at
- updated_at

oauth_accounts
- id
- user_id
- provider
- provider_account_id
- created_at

Add a unique constraint on:
(provider, provider_account_id)

Use an appropriate unique index for normalized non-null email addresses.`,
    code: `const [rows] = await connection.execute(
  \`SELECT users.*
   FROM users
   INNER JOIN oauth_accounts
     ON oauth_accounts.user_id = users.id
   WHERE oauth_accounts.provider = ?
     AND oauth_accounts.provider_account_id = ?
   LIMIT 1\`,
  ["facebook", facebookUserId],
);

const user = Array.isArray(rows) ? rows[0] : null;`,
    implemented: false,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Illustrative alternative using Supabase PostgreSQL tables for application users and linked Facebook accounts.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    setup: `Create users and oauth_accounts tables in Supabase.

users
- id
- email
- name
- image_url
- email_verified
- created_at
- updated_at

oauth_accounts
- id
- user_id
- provider
- provider_account_id
- created_at

Add a unique constraint on:
(provider, provider_account_id)

Add a partial unique index for non-null normalized email addresses.

Use a server-side privileged client for trusted authentication operations.`,
    code: `const { data: account, error } = await supabase
  .from("oauth_accounts")
  .select("user_id")
  .eq("provider", "facebook")
  .eq("provider_account_id", facebookUserId)
  .maybeSingle();

if (error) {
  throw error;
}

if (account) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", account.user_id)
    .single();

  if (userError) {
    throw userError;
  }
}`,
    implemented: false,
  },
];
