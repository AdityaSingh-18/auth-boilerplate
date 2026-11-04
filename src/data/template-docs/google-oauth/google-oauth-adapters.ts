import type { DatabaseAdapterExample } from "@/types/auth";

export const googleOAuthAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon",
    description:
      "PostgreSQL adapter using Neon Serverless Driver. Implements user storage, Google OAuth account lookup, and account linking.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    implemented: true,
    setup: `1. Install the Neon Serverless Driver:
   pnpm add @neondatabase/serverless

2. Create a Neon project and copy its connection string.

3. Add DATABASE_URL to your .env.local file.

4. Run the SQL from core/db/schema.sql in the Neon SQL Editor.

5. Use the Neon adapter implementation in core/lib/auth-db.ts.`,
    code: `import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function findUserByGoogleAccount(
  googleId: string
) {
  const rows = await sql\`
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url,
      users.email_verified
    FROM oauth_accounts
    JOIN users ON users.id = oauth_accounts.user_id
    WHERE oauth_accounts.provider = 'google'
      AND oauth_accounts.provider_account_id = \${googleId}
    LIMIT 1
  \`;

  return rows[0] ?? null;
}`,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description:
      "Reference adapter structure for storing users and linked Google OAuth accounts in MongoDB collections.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    implemented: false,
    setup: `1. Install the MongoDB Node.js driver:
   pnpm add mongodb

2. Create a MongoDB database.

3. Add MONGODB_URI and MONGODB_DATABASE to your .env.local file.

4. Create users and oauth_accounts collections.

5. Add a unique compound index on provider and provider_account_id.

6. Implement the database operations from core/lib/auth-db.ts using MongoDB queries and atomic updates.`,
    code: `import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

const db = client.db(process.env.MONGODB_DATABASE);

const users = db.collection("users");
const oauthAccounts = db.collection("oauth_accounts");

export async function findUserByGoogleAccount(
  googleId: string
) {
  const account = await oauthAccounts.findOne({
    provider: "google",
    provider_account_id: googleId,
  });

  if (!account) {
    return null;
  }

  return users.findOne({
    _id: account.user_id,
  });
}

// Implement user creation and account linking
// with appropriate unique indexes and atomic operations.`,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Reference adapter structure for storing users and linked Google OAuth accounts in MySQL.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    implemented: false,
    setup: `1. Install the MySQL driver:
   pnpm add mysql2

2. Create a MySQL database.

3. Add DATABASE_URL to your .env.local file.

4. Create users and oauth_accounts tables.

5. Add a unique constraint on provider and provider_account_id.

6. Implement the database operations from core/lib/auth-db.ts using parameterized MySQL queries.`,
    code: `import mysql from "mysql2/promise";

const pool = mysql.createPool(
  process.env.DATABASE_URL!
);

export async function findUserByGoogleAccount(
  googleId: string
) {
  const [rows] = await pool.execute(
    \`SELECT users.*
     FROM oauth_accounts
     JOIN users ON users.id = oauth_accounts.user_id
     WHERE oauth_accounts.provider = ?
       AND oauth_accounts.provider_account_id = ?
     LIMIT 1\`,
    ["google", googleId]
  );

  return Array.isArray(rows) && rows.length > 0
    ? rows[0]
    : null;
}

// Implement user creation and account linking
// with transactions and appropriate unique constraints.`,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Reference adapter structure using Supabase PostgreSQL for storing application users and linked Google OAuth accounts. This uses Supabase as a database, not Supabase Auth.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    implemented: false,
    setup: `1. Install the Supabase JavaScript client:
   pnpm add @supabase/supabase-js

2. Create a Supabase project.

3. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env.local file.

4. Create users and oauth_accounts tables.

5. Add a unique constraint on provider and provider_account_id.

6. Implement the database operations from core/lib/auth-db.ts using Supabase database queries.

7. Keep the service role key on the server. Never expose it to browser code.`,
    code: `import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function findUserByGoogleAccount(
  googleId: string
) {
  const { data, error } = await supabase
    .from("oauth_accounts")
    .select("user_id, users(*)")
    .eq("provider", "google")
    .eq("provider_account_id", googleId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.users ?? null;
}

// Implement user creation and account linking
// with appropriate database constraints.`,
  },
];
