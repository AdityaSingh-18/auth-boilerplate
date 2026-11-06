import type { DatabaseAdapterExample } from "@/types/auth";

export const oidcSsoAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon PostgreSQL",
    description:
      "The implemented database adapter. Stores users, administrator-configured OIDC tenants, and external OIDC identities using PostgreSQL.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup: `CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oidc_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  issuer TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oidc_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (issuer, subject)
);

CREATE INDEX IF NOT EXISTS oidc_accounts_user_id_idx
  ON oidc_accounts(user_id);

CREATE INDEX IF NOT EXISTS oidc_accounts_email_idx
  ON oidc_accounts(LOWER(email));

CREATE INDEX IF NOT EXISTS oidc_tenants_enabled_domain_idx
  ON oidc_tenants(domain)
  WHERE enabled = TRUE;`,
    code: `import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function findOidcAccount(
  issuer: string,
  subject: string,
) {
  const rows = await sql\`
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url
    FROM oidc_accounts
    INNER JOIN users ON users.id = oidc_accounts.user_id
    WHERE oidc_accounts.issuer = \${issuer}
      AND oidc_accounts.subject = \${subject}
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
      "Reference document model for storing users, tenant mappings, and OIDC identities in MongoDB. A MongoDB-specific auth-db implementation is required before using this adapter.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    setup: `// Collection: users
{
  _id: ObjectId,
  email: "user@example.com",
  name: "Example User",
  imageUrl: null,
  createdAt: ISODate(),
  updatedAt: ISODate()
}

// Collection: oidc_tenants
{
  _id: ObjectId,
  domain: "example.com",
  issuer: "https://identity.example.com",
  enabled: true,
  createdAt: ISODate(),
  updatedAt: ISODate()
}

// Collection: oidc_accounts
{
  _id: ObjectId,
  userId: ObjectId,
  issuer: "https://identity.example.com",
  subject: "provider-subject-id",
  email: "user@example.com",
  emailVerified: true,
  createdAt: ISODate(),
  updatedAt: ISODate()
}

// Create unique indexes:
db.oidc_tenants.createIndex(
  { domain: 1 },
  { unique: true }
);

db.oidc_tenants.createIndex(
  { issuer: 1 },
  { unique: true }
);

db.oidc_accounts.createIndex(
  { issuer: 1, subject: 1 },
  { unique: true }
);

db.oidc_accounts.createIndex({ userId: 1 });`,
    code: `const account = await db.collection("oidc_accounts").findOne({
  issuer: "https://identity.example.com",
  subject: "provider-subject-id",
});

if (account) {
  const user = await db.collection("users").findOne({
    _id: account.userId,
  });

  return user;
}

return null;`,
    implemented: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Reference relational schema for MySQL. Replace the Neon query implementation with a MySQL adapter and use transactions for atomic user and identity creation.",
    packageName: "mysql2",
    envVariables: ["MYSQL_HOST", "MYSQL_PORT", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"],
    setup: `CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  name VARCHAR(255) NULL,
  image_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE oidc_tenants (
  id CHAR(36) PRIMARY KEY,
  domain VARCHAR(253) NOT NULL UNIQUE,
  issuer VARCHAR(2048) NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE oidc_accounts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  issuer VARCHAR(2048) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY oidc_issuer_subject_unique (issuer(500), subject),
  INDEX oidc_user_id_idx (user_id),
  CONSTRAINT oidc_accounts_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);`,
    code: `const [rows] = await pool.execute(
  \`SELECT
     users.id,
     users.email,
     users.name,
     users.image_url
   FROM oidc_accounts
   INNER JOIN users ON users.id = oidc_accounts.user_id
   WHERE oidc_accounts.issuer = ?
     AND oidc_accounts.subject = ?
   LIMIT 1\`,
  [issuer, subject],
);

const accountRows = rows as Array<{
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
}>;

return accountRows[0] ?? null;`,
    implemented: false,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Reference PostgreSQL schema for Supabase. The current template uses Neon directly; a Supabase client and corresponding auth-db implementation are needed to use Supabase.",
    packageName: "@supabase/supabase-js",
    envVariables: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    setup: `CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.oidc_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  issuer TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.oidc_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (issuer, subject)
);

CREATE INDEX oidc_accounts_user_id_idx
  ON public.oidc_accounts(user_id);

CREATE INDEX oidc_accounts_email_idx
  ON public.oidc_accounts(LOWER(email));

CREATE INDEX oidc_tenants_enabled_domain_idx
  ON public.oidc_tenants(domain)
  WHERE enabled = TRUE;

-- Enable row-level security and keep these tables inaccessible
-- to unauthenticated clients. Use server-side service credentials
-- only in trusted server modules.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oidc_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oidc_accounts ENABLE ROW LEVEL SECURITY;`,
    code: `const { data, error } = await supabase
  .from("oidc_accounts")
  .select(
    "user_id, users(id, email, name, image_url)",
  )
  .eq("issuer", issuer)
  .eq("subject", subject)
  .maybeSingle();

if (error) {
  throw new Error("Unable to look up OIDC identity");
}

return data?.users ?? null;`,
    implemented: false,
  },
];
