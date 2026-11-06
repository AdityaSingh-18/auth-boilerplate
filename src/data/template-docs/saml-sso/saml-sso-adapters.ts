import type { DatabaseAdapterExample } from "@/types/auth";

export const samlSsoAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon PostgreSQL",
    description:
      "The implemented database adapter for this SAML SSO boilerplate. It stores application users and external SAML identities in PostgreSQL.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup: `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saml_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    idp_issuer TEXT NOT NULL,
    name_id TEXT NOT NULL,
    name_id_format TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT saml_accounts_idp_name_id_unique
        UNIQUE (idp_issuer, name_id)
);`,
    code: `import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function findUserBySamlIdentity(
  idpIssuer: string,
  nameId: string,
) {
  const rows = await sql\`
    SELECT users.id, users.email, users.name, users.created_at
    FROM saml_accounts
    INNER JOIN users ON users.id = saml_accounts.user_id
    WHERE saml_accounts.idp_issuer = \${idpIssuer}
      AND saml_accounts.name_id = \${nameId}
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
      "An illustrative adapter option. Store users and SAML identities in separate collections, enforcing a unique compound index on the Identity Provider issuer and NameID.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    setup: `db.saml_accounts.createIndex(
  { idpIssuer: 1, nameId: 1 },
  { unique: true }
);

db.saml_accounts.createIndex({ userId: 1 });`,
    code: `// Illustrative MongoDB identity lookup.
// Adapt the database operations in core/lib/auth-db.ts
// to your MongoDB client and collection names.

const account = await db.collection("saml_accounts").findOne({
  idpIssuer,
  nameId,
});

if (!account) {
  return null;
}

return db.collection("users").findOne({
  _id: account.userId,
});`,
    implemented: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "An illustrative adapter option. Store external SAML identities in a separate table with a unique composite key for the issuer and NameID.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup: `CREATE TABLE saml_accounts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    idp_issuer VARCHAR(512) NOT NULL,
    name_id VARCHAR(512) NOT NULL,
    name_id_format VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY saml_accounts_idp_name_id_unique
        (idp_issuer, name_id),
    INDEX saml_accounts_user_id_idx (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);`,
    code: `// Illustrative MySQL identity lookup.
// Adapt the database operations in core/lib/auth-db.ts
// to your MySQL connection and query API.

const [rows] = await connection.execute(
  \`SELECT users.id, users.email, users.name
   FROM saml_accounts
   INNER JOIN users ON users.id = saml_accounts.user_id
   WHERE saml_accounts.idp_issuer = ?
     AND saml_accounts.name_id = ?
   LIMIT 1\`,
  [idpIssuer, nameId],
);

return Array.isArray(rows) ? rows[0] ?? null : null;`,
    implemented: false,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "An illustrative adapter option using Supabase PostgreSQL. Create the same user and external identity relationship and enforce a unique issuer and NameID combination.",
    packageName: "@supabase/supabase-js",
    envVariables: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    setup: `CREATE TABLE public.saml_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    idp_issuer TEXT NOT NULL,
    name_id TEXT NOT NULL,
    name_id_format TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (idp_issuer, name_id)
);

CREATE INDEX saml_accounts_user_id_idx
    ON public.saml_accounts (user_id);`,
    code: `// Illustrative Supabase identity lookup.
// Use a server-only Supabase client with appropriate
// service-role permissions in your auth-db implementation.

const { data, error } = await supabase
  .from("saml_accounts")
  .select("user_id")
  .eq("idp_issuer", idpIssuer)
  .eq("name_id", nameId)
  .maybeSingle();

if (error) {
  throw error;
}

if (!data) {
  return null;
}

const { data: user, error: userError } = await supabase
  .from("users")
  .select("id, email, name, created_at")
  .eq("id", data.user_id)
  .maybeSingle();

if (userError) {
  throw userError;
}

return user;`,
    implemented: false,
  },
];
