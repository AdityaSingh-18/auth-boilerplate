import type { DatabaseAdapterExample } from "@/types/auth";

export const microsoftOAuthAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon PostgreSQL",
    description:
      "Serverless PostgreSQL adapter used by the included Microsoft OAuth implementation.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup: `import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);`,
    code: `// Find a Microsoft account using its tenant and object IDs.
const result = await sql\`
  SELECT u.*
  FROM oauth_accounts a
  JOIN users u ON u.id = a.user_id
  WHERE a.provider = 'microsoft'
    AND a.provider_tenant_id = \${tenantId}
    AND a.provider_account_id = \${accountId}
  LIMIT 1
\`;

const user = result[0] ?? null;`,
    implemented: true,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description:
      "Reference implementation using MongoDB collections for users and OAuth account identities.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    setup: `import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
await client.connect();

const db = client.db(process.env.MONGODB_DATABASE);`,
    code: `const account = await db.collection("oauth_accounts").findOne({
  provider: "microsoft",
  providerTenantId: tenantId,
  providerAccountId: accountId,
});

const user = account
  ? await db.collection("users").findOne({ _id: account.userId })
  : null;`,
    implemented: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Reference implementation using MySQL tables for users and OAuth account identities.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup: `import mysql from "mysql2/promise";

const pool = mysql.createPool(process.env.DATABASE_URL!);`,
    code: `const [rows] = await pool.execute(
  \`SELECT u.*
   FROM oauth_accounts a
   JOIN users u ON u.id = a.user_id
   WHERE a.provider = ?
     AND a.provider_tenant_id = ?
     AND a.provider_account_id = ?
   LIMIT 1\`,
  ["microsoft", tenantId, accountId]
);

const user = Array.isArray(rows) && rows.length > 0
  ? rows[0]
  : null;`,
    implemented: false,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Reference implementation using Supabase PostgreSQL tables for users and OAuth account identities.",
    packageName: "@supabase/supabase-js",
    envVariables: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    setup: `import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);`,
    code: `const { data: account, error } = await supabase
  .from("oauth_accounts")
  .select("user_id")
  .eq("provider", "microsoft")
  .eq("provider_tenant_id", tenantId)
  .eq("provider_account_id", accountId)
  .maybeSingle();

if (error) throw error;

const { data: user, error: userError } = account
  ? await supabase
      .from("users")
      .select("*")
      .eq("id", account.user_id)
      .maybeSingle()
  : { data: null, error: null };

if (userError) throw userError;`,
    implemented: false,
  },
];
