import type { DatabaseAdapterExample } from "@/types/auth";

export const xOAuthAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon PostgreSQL",
    description:
      "The implemented adapter uses Neon Serverless PostgreSQL to store application users and linked X OAuth accounts.",
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

export async function findUserByXAccount(
  providerAccountId: string
) {
  const rows = await sql\`
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url,
      users.email_verified
    FROM users
    INNER JOIN oauth_accounts
      ON oauth_accounts.user_id = users.id
    WHERE oauth_accounts.provider = 'x'
      AND oauth_accounts.provider_account_id = \${providerAccountId}
    LIMIT 1
  \`;

  return rows[0] ?? null;
}

export async function linkXAccount(
  userId: string,
  providerAccountId: string
) {
  await sql\`
    INSERT INTO oauth_accounts (
      user_id,
      provider,
      provider_account_id
    )
    VALUES (
      \${userId},
      'x',
      \${providerAccountId}
    )
    ON CONFLICT (provider, provider_account_id)
    DO NOTHING
  \`;
}`,
    implemented: true,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description:
      "A reference approach using MongoDB collections for application users and linked X OAuth accounts.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    setup: `Create two collections:

users
- _id
- email
- name
- imageUrl
- emailVerified
- createdAt
- updatedAt

oauth_accounts
- _id
- userId
- provider
- providerAccountId
- createdAt

Create a unique index on:
{ provider: 1, providerAccountId: 1 }

Create a unique partial index on normalized user email when present.`,
    code: `import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

const db = client.db(process.env.MONGODB_DATABASE);

const users = db.collection("users");
const oauthAccounts = db.collection("oauth_accounts");

export async function findUserByXAccount(
  providerAccountId: string
) {
  const account = await oauthAccounts.findOne({
    provider: "x",
    providerAccountId,
  });

  if (!account) return null;

  return users.findOne({
    _id: new ObjectId(account.userId),
  });
}`,
    implemented: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "A reference approach using MySQL tables to store users and X OAuth account relationships.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup: `CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NULL,
  name VARCHAR(255) NULL,
  image_url TEXT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE oauth_accounts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY provider_account_unique (
    provider,
    provider_account_id
  ),
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);`,
    code: `import mysql from "mysql2/promise";

const pool = mysql.createPool(
  process.env.DATABASE_URL!
);

export async function findUserByXAccount(
  providerAccountId: string
) {
  const [rows] = await pool.execute(
    \`SELECT users.*
     FROM users
     INNER JOIN oauth_accounts
       ON oauth_accounts.user_id = users.id
     WHERE oauth_accounts.provider = ?
       AND oauth_accounts.provider_account_id = ?
     LIMIT 1\`,
    ["x", providerAccountId]
  );

  return Array.isArray(rows) ? rows[0] ?? null : null;
}`,
    implemented: false,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "A reference approach using Supabase PostgreSQL and its JavaScript client for user and provider account storage.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    setup: `Create users and oauth_accounts tables.

users:
- id UUID PRIMARY KEY
- email TEXT NULL
- name TEXT NULL
- image_url TEXT NULL
- email_verified BOOLEAN DEFAULT FALSE

oauth_accounts:
- id UUID PRIMARY KEY
- user_id UUID REFERENCES users(id)
- provider TEXT
- provider_account_id TEXT

Add a unique constraint on:
(provider, provider_account_id)

Add a unique partial index on LOWER(email)
for non-null email addresses.`,
    code: `import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function findUserByXAccount(
  providerAccountId: string
) {
  const { data: account, error: accountError } =
    await supabase
      .from("oauth_accounts")
      .select("user_id")
      .eq("provider", "x")
      .eq("provider_account_id", providerAccountId)
      .maybeSingle();

  if (accountError) throw accountError;
  if (!account) return null;

  const { data: user, error: userError } =
    await supabase
      .from("users")
      .select("*")
      .eq("id", account.user_id)
      .maybeSingle();

  if (userError) throw userError;

  return user;
}`,
    implemented: false,
  },
];
