import type { DatabaseAdapterExample } from "@/types/auth";

export const smsOtpAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon",
    description:
      "PostgreSQL adapter using Neon Serverless Driver. Implements user storage, OTP challenge creation and invalidation, verification attempts, one-time OTP consumption, and per-phone rate limits.",
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
  phone: string;
}

export async function findUserByPhone(
  phone: string
): Promise<AuthUser | null> {
  const rows = await sql\`
    SELECT id::text, phone
    FROM users
    WHERE phone = \${phone}
    LIMIT 1
  \`;

  return (rows[0] as AuthUser) ?? null;
}

export async function createUser(input: {
  phone: string;
}): Promise<AuthUser | null> {
  const rows = await sql\`
    INSERT INTO users (id, phone)
    VALUES (\${randomUUID()}::uuid, \${input.phone})
    ON CONFLICT (phone) DO NOTHING
    RETURNING id::text, phone
  \`;

  return (rows[0] as AuthUser) ?? null;
}

export async function consumeOtpChallenge(
  id: string
): Promise<boolean> {
  const rows = await sql\`
    UPDATE sms_otp_challenges
    SET consumed_at = NOW()
    WHERE id = \${id}::uuid
      AND consumed_at IS NULL
      AND expires_at > NOW()
      AND attempts < 5
    RETURNING id
  \`;

  return rows.length > 0;
}

// The complete implementation also includes:
// createOtpChallenge()
// findActiveOtpChallenge()
// incrementOtpAttempts()
// invalidateOtpChallenge()
// consumeRateLimit()
//
// See core/lib/auth-db.ts for the complete adapter.`,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description:
      "Reference adapter structure for storing users, SMS OTP challenges, and rate-limit records in MongoDB collections.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    implemented: false,
    setup: `1. Install the MongoDB Node.js driver:
   pnpm add mongodb

2. Create a MongoDB database.

3. Add MONGODB_URI and MONGODB_DATABASE to .env.local.

4. Create collections for users, SMS OTP challenges, and rate limits.

5. Implement the database operations shown in the Neon adapter using MongoDB queries and atomic updates.

6. Add unique indexes for user phone numbers and rate-limit keys.`,
    code: `// Reference structure — not a drop-in implementation.

import { MongoClient } from "mongodb";

const client = new MongoClient(
  process.env.MONGODB_URI!
);

const db = client.db(process.env.MONGODB_DATABASE);

const users = db.collection("users");
const challenges = db.collection("sms_otp_challenges");
const rateLimits = db.collection("sms_otp_rate_limits");

// Implement the adapter operations:
//
// findUserByPhone()
// findUserById()
// createUser()
// createOtpChallenge()
// findActiveOtpChallenge()
// incrementOtpAttempts()
// consumeOtpChallenge()
// invalidateOtpChallenge()
// consumeRateLimit()
//
// Use atomic MongoDB operations for OTP consumption,
// verification attempts, and rate-limit updates.`,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Reference adapter structure for storing users, SMS OTP challenges, and rate-limit records in MySQL.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    implemented: false,
    setup: `1. Install the MySQL driver:
   pnpm add mysql2

2. Create a MySQL database.

3. Add DATABASE_URL to .env.local.

4. Create users, sms_otp_challenges, and sms_otp_rate_limits tables based on the Neon schema.

5. Implement the adapter operations using parameterized MySQL queries.

6. Add unique constraints and indexes for phone numbers and rate-limit keys.`,
    code: `// Reference structure — not a drop-in implementation.

import mysql from "mysql2/promise";

const pool = mysql.createPool(
  process.env.DATABASE_URL!
);

// Implement the adapter operations:
//
// findUserByPhone()
// findUserById()
// createUser()
// createOtpChallenge()
// findActiveOtpChallenge()
// incrementOtpAttempts()
// consumeOtpChallenge()
// invalidateOtpChallenge()
// consumeRateLimit()
//
// Use transactions or atomic conditional UPDATE
// statements for one-time OTP consumption and
// rate-limit updates.
//
// Never concatenate user input into SQL strings.`,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Reference adapter structure using Supabase Postgres as the SMS OTP database. This uses database queries directly rather than Supabase Auth.",
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

4. Create users, sms_otp_challenges, and sms_otp_rate_limits tables.

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
// findUserByPhone()
// findUserById()
// createUser()
// createOtpChallenge()
// findActiveOtpChallenge()
// incrementOtpAttempts()
// consumeOtpChallenge()
// invalidateOtpChallenge()
// consumeRateLimit()
//
// Use conditional database updates or PostgreSQL
// functions for atomic OTP and rate-limit operations.
//
// This adapter uses Supabase as a database,
// not Supabase Auth.`,
  },
];
