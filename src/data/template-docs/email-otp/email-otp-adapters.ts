
import type { DatabaseAdapterExample } from "@/types/auth";

export const emailOtpAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon",
    description:
      "PostgreSQL adapter using Neon Serverless Driver. Implements user storage, OTP challenges, failed-attempt tracking, and per-email rate limits.",
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
import { randomUUID } from "node:crypto";

const sql = neon(process.env.DATABASE_URL!);

export interface AuthUser {
  id: string;
  email: string;
}

export interface OtpChallenge {
  id: string;
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
}

export async function findUserByEmail(
  email: string
): Promise<AuthUser | null> {
  const rows = await sql\`
    SELECT id, email
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
    SELECT id, email
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
    RETURNING id, email
  \`;

  return (rows[0] as AuthUser) ?? null;
}

export async function createOtpChallenge(input: {
  email: string;
  otpHash: string;
  expiresAt: Date;
}): Promise<OtpChallenge> {
  const id = randomUUID();

  const rows = await sql\`
    WITH consumed AS (
      UPDATE email_otp_challenges
      SET consumed_at = NOW()
      WHERE email = \${input.email}
        AND consumed_at IS NULL
    )
    INSERT INTO email_otp_challenges (
      id,
      email,
      otp_hash,
      expires_at
    )
    VALUES (
      \${id},
      \${input.email},
      \${input.otpHash},
      \${input.expiresAt}
    )
    RETURNING
      id,
      email,
      otp_hash AS "otpHash",
      expires_at AS "expiresAt",
      attempts
  \`;

  return rows[0] as OtpChallenge;
}

export async function findActiveOtpChallenge(
  email: string
): Promise<OtpChallenge | null> {
  const rows = await sql\`
    SELECT
      id,
      email,
      otp_hash AS "otpHash",
      expires_at AS "expiresAt",
      attempts
    FROM email_otp_challenges
    WHERE email = \${email}
      AND consumed_at IS NULL
      AND expires_at > NOW()
      AND attempts < 5
    ORDER BY created_at DESC
    LIMIT 1
  \`;

  return (rows[0] as OtpChallenge) ?? null;
}

export async function incrementOtpAttempts(
  id: string
): Promise<boolean> {
  const rows = await sql\`
    UPDATE email_otp_challenges
    SET attempts = attempts + 1
    WHERE id = \${id}
      AND consumed_at IS NULL
      AND expires_at > NOW()
      AND attempts < 5
    RETURNING id
  \`;

  return rows.length > 0;
}

export async function consumeOtpChallenge(
  id: string
): Promise<boolean> {
  const rows = await sql\`
    UPDATE email_otp_challenges
    SET consumed_at = NOW()
    WHERE id = \${id}
      AND consumed_at IS NULL
      AND expires_at > NOW()
      AND attempts < 5
    RETURNING id
  \`;

  return rows.length > 0;
}

export async function consumeRateLimit(
  email: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const rows = await sql\`
    INSERT INTO email_otp_rate_limits (
      email,
      action,
      request_count,
      window_started_at
    )
    VALUES (
      \${email},
      \${action},
      1,
      NOW()
    )
    ON CONFLICT (email, action)
    DO UPDATE SET
      request_count = CASE
        WHEN email_otp_rate_limits.window_started_at
          <= NOW() - (\${windowSeconds} * INTERVAL '1 second')
        THEN 1
        ELSE email_otp_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN email_otp_rate_limits.window_started_at
          <= NOW() - (\${windowSeconds} * INTERVAL '1 second')
        THEN NOW()
        ELSE email_otp_rate_limits.window_started_at
      END
    WHERE
      email_otp_rate_limits.window_started_at
        <= NOW() - (\${windowSeconds} * INTERVAL '1 second')
      OR email_otp_rate_limits.request_count < \${maxRequests}
    RETURNING email
  \`;

  return rows.length > 0;
}`,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description:
      "Reference adapter structure for storing users, OTP challenges, and rate-limit records in MongoDB collections.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    implemented: false,
    setup: `1. Install the MongoDB Node.js driver:
   pnpm add mongodb

2. Create a MongoDB database.

3. Add MONGODB_URI and MONGODB_DATABASE to .env.local.

4. Create collections for users, email OTP challenges, and rate limits.

5. Implement the database operations shown in the Neon adapter using MongoDB queries and atomic updates.

6. Add unique indexes for user email and the rate-limit email/action pair.`,
    code: `// Reference structure — not a drop-in implementation.

import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

const db = client.db(process.env.MONGODB_DATABASE);

const users = db.collection("users");
const challenges = db.collection("email_otp_challenges");
const rateLimits = db.collection("email_otp_rate_limits");

// Implement the adapter operations:
//
// findUserByEmail()
// findUserById()
// createUser()
// createOtpChallenge()
// findActiveOtpChallenge()
// incrementOtpAttempts()
// consumeOtpChallenge()
// consumeRateLimit()
//
// Use atomic MongoDB operations for attempt counts,
// challenge consumption, and rate-limit updates.`,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Reference adapter structure for storing users, OTP challenges, and rate-limit records in MySQL.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    implemented: false,
    setup: `1. Install the MySQL driver:
   pnpm add mysql2

2. Create a MySQL database.

3. Add DATABASE_URL to .env.local.

4. Create users, email_otp_challenges, and email_otp_rate_limits tables based on the fields in the Neon schema.

5. Implement the adapter operations using parameterized MySQL queries.

6. Add unique constraints for user email and the rate-limit email/action pair.`,
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
// createOtpChallenge()
// findActiveOtpChallenge()
// incrementOtpAttempts()
// consumeOtpChallenge()
// consumeRateLimit()
//
// Use transactions or atomic conditional UPDATE
// statements for challenge and rate-limit operations.
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

4. Create the users, email_otp_challenges, and email_otp_rate_limits tables.

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
// createOtpChallenge()
// findActiveOtpChallenge()
// incrementOtpAttempts()
// consumeOtpChallenge()
// consumeRateLimit()
//
// Use conditional database updates or PostgreSQL
// functions for atomic challenge and rate-limit operations.
//
// This adapter uses Supabase as a database,
// not Supabase Auth.`,
  },
];
