import type { DatabaseAdapterExample } from "@/types/auth";

export const magicLinkAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon",
    description:
      "PostgreSQL adapter using Neon Serverless Driver. Implements user storage, magic-link token creation and consumption, previous-link invalidation, and per-email rate limits.",
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

export interface AuthUser {
  id: string;
  email: string;
}

export async function findUserByEmail(
  email: string
): Promise<AuthUser | null> {
  const rows = await sql\`
    SELECT id::text, email
    FROM users
    WHERE email = \${email}
    LIMIT 1
  \`;

  return (rows[0] as AuthUser) ?? null;
}

export async function findUserById(
  id: string
): Promise<AuthUser | null> {
  const rows = await sql\`
    SELECT id::text, email
    FROM users
    WHERE id = \${id}
    LIMIT 1
  \`;

  return (rows[0] as AuthUser) ?? null;
}

export async function createUser(input: {
  id: string;
  email: string;
}): Promise<AuthUser | null> {
  const rows = await sql\`
    INSERT INTO users (id, email)
    VALUES (\${input.id}, \${input.email})
    ON CONFLICT (email) DO NOTHING
    RETURNING id::text, email
  \`;

  return (rows[0] as AuthUser) ?? null;
}

export async function createMagicLinkToken(input: {
  email: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const rows = await sql\`
    WITH consumed AS (
      UPDATE magic_link_tokens
      SET consumed_at = NOW()
      WHERE email = \${input.email}
        AND consumed_at IS NULL
      RETURNING id
    )
    INSERT INTO magic_link_tokens (
      email,
      token_hash,
      expires_at
    )
    VALUES (
      \${input.email},
      \${input.tokenHash},
      \${input.expiresAt}
    )
    RETURNING
      id::text,
      email,
      token_hash AS "tokenHash",
      expires_at AS "expiresAt"
  \`;

  return rows[0];
}

export async function consumeMagicLinkToken(
  tokenHash: string
) {
  const rows = await sql\`
    UPDATE magic_link_tokens
    SET consumed_at = NOW()
    WHERE token_hash = \${tokenHash}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    RETURNING id::text, email
  \`;

  return rows[0] ?? null;
}

export async function consumeMagicLinkRateLimit(
  email: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const rows = await sql\`
    INSERT INTO magic_link_rate_limits (
      email,
      request_count,
      window_started_at
    )
    VALUES (
      \${email},
      1,
      NOW()
    )
    ON CONFLICT (email)
    DO UPDATE SET
      request_count = CASE
        WHEN magic_link_rate_limits.window_started_at
          <= NOW() - (\${windowSeconds} * INTERVAL '1 second')
        THEN 1
        ELSE magic_link_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN magic_link_rate_limits.window_started_at
          <= NOW() - (\${windowSeconds} * INTERVAL '1 second')
        THEN NOW()
        ELSE magic_link_rate_limits.window_started_at
      END
    WHERE
      magic_link_rate_limits.window_started_at
        <= NOW() - (\${windowSeconds} * INTERVAL '1 second')
      OR magic_link_rate_limits.request_count < \${maxRequests}
    RETURNING email
  \`;

  return rows.length > 0;
}`,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description:
      "Reference adapter structure for storing users, magic-link tokens, and rate-limit records in MongoDB collections.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    implemented: false,
    setup: `1. Install the MongoDB Node.js driver:
   pnpm add mongodb

2. Create a MongoDB database.

3. Add MONGODB_URI and MONGODB_DATABASE to .env.local.

4. Create collections for users, magic-link tokens, and rate limits.

5. Implement the database operations shown in the Neon adapter using MongoDB queries and atomic updates.

6. Add unique indexes for user email and token hash.`,
    code: `// Reference structure — not a drop-in implementation.

import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

const db = client.db(process.env.MONGODB_DATABASE);

const users = db.collection("users");
const tokens = db.collection("magic_link_tokens");
const rateLimits = db.collection("magic_link_rate_limits");

// Implement the adapter operations:
//
// findUserByEmail()
// findUserById()
// createUser()
// createMagicLinkToken()
// consumeMagicLinkToken()
// consumeMagicLinkRateLimit()
//
// Use atomic MongoDB operations for token consumption
// and rate-limit updates. Ensure previous unconsumed
// tokens are invalidated when a new link is requested.`,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Reference adapter structure for storing users, magic-link tokens, and rate-limit records in MySQL.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    implemented: false,
    setup: `1. Install the MySQL driver:
   pnpm add mysql2

2. Create a MySQL database.

3. Add DATABASE_URL to .env.local.

4. Create users, magic_link_tokens, and magic_link_rate_limits tables based on the fields in the Neon schema.

5. Implement the adapter operations using parameterized MySQL queries.

6. Add unique constraints for user email, token hash, and the rate-limit email.`,
    code: `// Reference structure — not a drop-in implementation.

import mysql from "mysql2/promise";

const pool = mysql.createPool(
  process.env.DATABASE_URL!
);

// Implement the adapter operations:
//
// findUserByEmail()
// findUserById()
// createUser()
// createMagicLinkToken()
// consumeMagicLinkToken()
// consumeMagicLinkRateLimit()
//
// Use transactions or atomic conditional UPDATE
// statements for one-time token consumption.
//
// Never concatenate user input into SQL strings.`,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Reference adapter structure using Supabase Postgres as the database. This uses database queries directly rather than Supabase Auth.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    implemented: false,
    setup: `1. Install the Supabase JavaScript client:
   pnpm add @supabase/supabase-js

2. Create a Supabase project.

3. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.

4. Create the users, magic_link_tokens, and magic_link_rate_limits tables.

5. Implement the adapter operations using Supabase database queries or PostgreSQL functions.

6. Keep the service role key on the server. Never expose it to browser code.`,
    code: `// Reference structure — not a drop-in implementation.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Implement the adapter operations:
//
// findUserByEmail()
// findUserById()
// createUser()
// createMagicLinkToken()
// consumeMagicLinkToken()
// consumeMagicLinkRateLimit()
//
// Use conditional database updates or PostgreSQL
// functions for atomic token and rate-limit operations.
//
// This adapter uses Supabase as a database,
// not Supabase Auth.`,
  },
];
