import type { DatabaseAdapterExample } from "@/types/auth";

export const discordOAuthAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon Postgres",
    description:
      "The included implementation uses Neon Postgres with the serverless driver to store users and linked Discord accounts.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup: `1. Create a Neon project.
2. Copy the database connection string.
3. Add DATABASE_URL to your environment.
4. Execute core/db/schema.sql against your database.`,
    code: `import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function findUserByDiscordAccount(
  discordAccountId: string
) {
  const rows = await sql\`
    SELECT users.*
    FROM users
    INNER JOIN oauth_accounts
      ON oauth_accounts.user_id = users.id
    WHERE oauth_accounts.provider = 'discord'
      AND oauth_accounts.provider_account_id = \${discordAccountId}
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
      "A MongoDB adaptation can store application users and linked Discord accounts in separate collections.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    setup: `1. Create a MongoDB database.
2. Install the MongoDB Node.js driver.
3. Add MONGODB_URI and MONGODB_DATABASE to your environment.
4. Create unique indexes for normalized user emails and provider/account ID pairs.
5. Implement the user and Discord account lookup and linking operations.`,
    code: `import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

export async function findUserByDiscordAccount(
  discordAccountId: string
) {
  const database = client.db(process.env.MONGODB_DATABASE);

  const account = await database
    .collection("oauth_accounts")
    .findOne({
      provider: "discord",
      provider_account_id: discordAccountId,
    });

  if (!account) return null;

  return database.collection("users").findOne({
    _id: account.user_id,
  });
}`,
    implemented: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "A MySQL adaptation can use relational users and OAuth account tables with unique constraints for email and provider account identity.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup: `1. Create a MySQL database.
2. Install the mysql2 package.
3. Add DATABASE_URL to your environment.
4. Create users and oauth_accounts tables.
5. Add unique indexes for normalized email and provider/account ID pairs.
6. Implement the user lookup, creation, and account-linking operations.`,
    code: `import mysql from "mysql2/promise";

const pool = mysql.createPool(process.env.DATABASE_URL!);

export async function findUserByDiscordAccount(
  discordAccountId: string
) {
  const [rows] = await pool.execute(
    \`SELECT users.*
     FROM users
     INNER JOIN oauth_accounts
       ON oauth_accounts.user_id = users.id
     WHERE oauth_accounts.provider = ?
       AND oauth_accounts.provider_account_id = ?
     LIMIT 1\`,
    ["discord", discordAccountId]
  );

  return (rows as Record<string, unknown>[])[0] ?? null;
}`,
    implemented: false,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "A Supabase adaptation can use Postgres tables and the Supabase JavaScript client to store application users and linked Discord accounts.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    setup: `1. Create a Supabase project.
2. Install @supabase/supabase-js.
3. Add the Supabase URL and server-side service role key to your environment.
4. Create users and oauth_accounts tables with unique constraints.
5. Implement the user lookup, creation, and account-linking operations using a server-side client.
6. Keep the service role key on the server only.`,
    code: `import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function findUserByDiscordAccount(
  discordAccountId: string
) {
  const { data: account, error: accountError } = await supabase
    .from("oauth_accounts")
    .select("user_id")
    .eq("provider", "discord")
    .eq("provider_account_id", discordAccountId)
    .maybeSingle();

  if (accountError) throw accountError;
  if (!account) return null;

  const { data: user, error: userError } = await supabase
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