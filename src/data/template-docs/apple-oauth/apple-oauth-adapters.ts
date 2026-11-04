import type { DatabaseAdapterExample } from "@/types/auth";

export const appleOAuthAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon PostgreSQL",
    description:
      "The implemented database adapter. Uses the Neon serverless driver and PostgreSQL tables to store application users and linked Apple accounts.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup: `1. Create a Neon PostgreSQL database.
2. Install @neondatabase/serverless.
3. Configure DATABASE_URL.
4. Execute core/db/schema.sql.
5. Use the existing core/lib/auth-db.ts implementation.`,
    code: `import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function findAppleAccount(
  appleUserId: string
) {
  const rows = await sql\`
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url,
      users.email_verified
    FROM oauth_accounts
    JOIN users
      ON users.id = oauth_accounts.user_id
    WHERE oauth_accounts.provider = 'apple'
      AND oauth_accounts.provider_account_id = \${appleUserId}
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
      "Illustrative MongoDB adapter structure for storing users and linked Apple accounts in separate collections.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI"],
    setup: `1. Create a MongoDB database.
2. Install the mongodb package.
3. Configure MONGODB_URI.
4. Create users and oauthAccounts collections.
5. Add a unique index for provider and providerAccountId.
6. Implement the user lookup and account-linking operations.`,
    code: `interface OAuthAccount {
  provider: "apple";
  providerAccountId: string;
  userId: string;
}

async function findAppleAccount(
  oauthAccounts: Collection<OAuthAccount>,
  appleUserId: string
) {
  return oauthAccounts.findOne({
    provider: "apple",
    providerAccountId: appleUserId,
  });
}`,
    implemented: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Illustrative MySQL adapter structure using separate users and OAuth account tables.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup: `1. Create a MySQL database.
2. Install mysql2.
3. Configure DATABASE_URL.
4. Create users and oauth_accounts tables.
5. Add a unique constraint for provider and provider_account_id.
6. Implement the user lookup and account-linking operations.`,
    code: `const [rows] = await connection.execute(
  \`SELECT users.*
   FROM oauth_accounts
   JOIN users
     ON users.id = oauth_accounts.user_id
   WHERE oauth_accounts.provider = ?
     AND oauth_accounts.provider_account_id = ?
   LIMIT 1\`,
  ["apple", appleUserId]
);`,
    implemented: false,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Illustrative Supabase PostgreSQL adapter structure using the Supabase JavaScript client.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    setup: `1. Create a Supabase project.
2. Install @supabase/supabase-js.
3. Configure the Supabase URL and server-side service role key.
4. Create users and oauth_accounts tables.
5. Add a unique constraint for provider and provider_account_id.
6. Implement the user lookup and account-linking operations on the server.`,
    code: `const { data, error } = await supabase
  .from("oauth_accounts")
  .select("users(*)")
  .eq("provider", "apple")
  .eq("provider_account_id", appleUserId)
  .maybeSingle();

if (error) {
  throw error;
}

return data?.users ?? null;`,
    implemented: false,
  },
];
