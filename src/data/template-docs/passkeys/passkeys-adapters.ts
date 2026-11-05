import type { DatabaseAdapterExample } from "@/types/auth";

export const passkeysAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "Neon PostgreSQL",
    description:
      "The implemented database adapter. Uses the Neon serverless PostgreSQL driver to store users, passkey credentials, authenticator counters, and WebAuthn challenges.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup: `CREATE TABLE passkey_credentials (
  credential_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] NOT NULL DEFAULT '{}',
  device_type TEXT,
  backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (
    purpose IN ('registration', 'authentication')
  ),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
    code: `import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

export const sql = neon(process.env.DATABASE_URL);

export async function getPasskeyByCredentialId(
  credentialId: string,
) {
  const rows = await sql\`
    SELECT credential_id, user_id, public_key, counter, transports
    FROM passkey_credentials
    WHERE credential_id = \${credentialId}
    LIMIT 1
  \`;

  return rows[0] ?? null;
}

export async function getUserPasskeys(userId: string) {
  return sql\`
    SELECT credential_id, public_key, counter, transports
    FROM passkey_credentials
    WHERE user_id = \${userId}
    ORDER BY created_at ASC
  \`;
}`,
    implemented: true,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Reference schema and query approach for storing passkey credentials and challenges in a Supabase PostgreSQL database. This adapter is not wired into the template.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    setup: `CREATE TABLE passkey_credentials (
  credential_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] NOT NULL DEFAULT '{}',
  device_type TEXT,
  backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (
    purpose IN ('registration', 'authentication')
  ),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
    code: `import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function getPasskeyByCredentialId(
  credentialId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("passkey_credentials")
    .select("*")
    .eq("credential_id", credentialId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUserPasskeys(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("passkey_credentials")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}`,
    implemented: false,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description:
      "Reference document structure for storing passkey credentials and challenges in MongoDB. This adapter is not wired into the template.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DATABASE"],
    setup: `{
  "passkey_credentials": {
    "credential_id": "unique string",
    "user_id": "application user ID",
    "public_key": "base64url encoded public key",
    "counter": 0,
    "transports": [],
    "device_type": null,
    "backed_up": false,
    "created_at": "date",
    "last_used_at": null
  },
  "passkey_challenges": {
    "challenge": "unique string",
    "user_id": "application user ID or null",
    "purpose": "registration or authentication",
    "expires_at": "date",
    "consumed_at": null,
    "created_at": "date"
  }
}`,
    code: `import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

export async function getPasskeyByCredentialId(
  credentialId: string,
) {
  await client.connect();

  const db = client.db(process.env.MONGODB_DATABASE);

  return db.collection("passkey_credentials").findOne({
    credential_id: credentialId,
  });
}

export async function getUserPasskeys(userId: string) {
  await client.connect();

  const db = client.db(process.env.MONGODB_DATABASE);

  return db
    .collection("passkey_credentials")
    .find({ user_id: userId })
    .sort({ created_at: 1 })
    .toArray();
}`,
    implemented: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Reference relational schema and query approach for storing passkey credentials and challenges in MySQL. This adapter is not wired into the template.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup: `CREATE TABLE passkey_credentials (
  credential_id VARCHAR(512) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT UNSIGNED NOT NULL DEFAULT 0,
  transports JSON NOT NULL,
  device_type VARCHAR(50),
  backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE passkey_challenges (
  id CHAR(36) PRIMARY KEY,
  challenge VARCHAR(512) NOT NULL UNIQUE,
  user_id CHAR(36) NULL,
  purpose VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
    code: `import mysql from "mysql2/promise";

export const pool = mysql.createPool(
  process.env.DATABASE_URL!,
);

export async function getPasskeyByCredentialId(
  credentialId: string,
) {
  const [rows] = await pool.execute(
    \`SELECT credential_id, user_id, public_key, counter, transports
     FROM passkey_credentials
     WHERE credential_id = ?
     LIMIT 1\`,
    [credentialId],
  );

  return rows;
}

export async function getUserPasskeys(userId: string) {
  const [rows] = await pool.execute(
    \`SELECT credential_id, public_key, counter, transports
     FROM passkey_credentials
     WHERE user_id = ?
     ORDER BY created_at ASC\`,
    [userId],
  );

  return rows;
}`,
    implemented: false,
  },
];
