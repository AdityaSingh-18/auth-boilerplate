import type { DatabaseAdapterExample } from "@/types/auth";

export const githubOAuthAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon PostgreSQL",
    description:
      "The database adapter implemented in this template. Uses the Neon serverless driver to store users and GitHub OAuth account links in PostgreSQL.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup: `1. Create a Neon PostgreSQL project.
2. Copy the connection string from the Neon dashboard.
3. Add it to DATABASE_URL in your .env.local file.
4. Execute core/db/schema.sql against your database.
5. Use the provided core/lib/auth-db.ts implementation.`,
    code: `import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function findUserByGitHubAccount(
  githubId: string
) {
  const rows = await sql\`
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url,
      users.email_verified
    FROM oauth_accounts
    INNER JOIN users
      ON users.id = oauth_accounts.user_id
    WHERE oauth_accounts.provider = 'github'
      AND oauth_accounts.provider_account_id = \${githubId}
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
      "Reference adapter showing how GitHub OAuth users and provider account links can be stored in MongoDB collections.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    setup: `1. Install the mongodb package.
2. Create a MongoDB database.
3. Configure MONGODB_URI and MONGODB_DATABASE.
4. Create a unique index on the normalized user email.
5. Create a unique compound index on provider and providerAccountId in the oauth_accounts collection.
6. Adapt the user and account operations to your MongoDB connection.`,
    code: `import { MongoClient } from "mongodb";

const client = new MongoClient(
  process.env.MONGODB_URI!
);

const db = client.db(
  process.env.MONGODB_DATABASE
);

const users = db.collection("users");
const accounts = db.collection("oauth_accounts");

export async function findUserByGitHubAccount(
  githubId: string
) {
  const account = await accounts.findOne({
    provider: "github",
    providerAccountId: githubId,
  });

  if (!account) return null;

  return users.findOne({
    _id: account.userId,
  });
}`,
    implemented: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Reference adapter showing the equivalent GitHub account lookup using MySQL and a relational users and oauth_accounts schema.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup: `1. Install mysql2.
2. Create a MySQL database.
3. Configure DATABASE_URL with your MySQL connection details.
4. Create users and oauth_accounts tables.
5. Add a unique index on normalized user email.
6. Add a unique constraint on provider and provider_account_id.
7. Adapt the query and result mapping to your MySQL client.`,
    code: `import mysql from "mysql2/promise";

const pool = mysql.createPool(
  process.env.DATABASE_URL!
);

export async function findUserByGitHubAccount(
  githubId: string
) {
  const [rows] = await pool.execute(
    \`SELECT
       users.id,
       users.email,
       users.name,
       users.image_url,
       users.email_verified
     FROM oauth_accounts
     INNER JOIN users
       ON users.id = oauth_accounts.user_id
     WHERE oauth_accounts.provider = ?
       AND oauth_accounts.provider_account_id = ?
     LIMIT 1\`,
    ["github", githubId]
  );

  return (rows as Record<string, unknown>[])[0] ?? null;
}`,
    implemented: false,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Reference adapter showing how GitHub OAuth account records and application users can be queried using the Supabase JavaScript client.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    setup: `1. Create a Supabase project.
2. Install @supabase/supabase-js.
3. Configure the Supabase URL and server-side service role key.
4. Create users and oauth_accounts tables with the required columns and unique constraints.
5. Keep the service role key server-side only.
6. Adapt the query and returned row mapping to your actual Supabase schema.`,
    code: `import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function findUserByGitHubAccount(
  githubId: string
) {
  const { data, error } = await supabase
    .from("oauth_accounts")
    .select(\`
      user_id,
      users (
        id,
        email,
        name,
        image_url,
        email_verified
      )
    \`)
    .eq("provider", "github")
    .eq("provider_account_id", githubId)
    .maybeSingle();

  if (error) throw error;

  return data?.users ?? null;
}`,
    implemented: false,
  },
];
