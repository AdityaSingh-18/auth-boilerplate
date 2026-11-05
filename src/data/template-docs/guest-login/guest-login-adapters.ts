import type { DatabaseAdapterExample } from "@/types/auth";

export const guestLoginAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "PostgreSQL · Neon",
    description:
      "Implemented PostgreSQL adapter using Neon serverless queries for guest user creation, user retrieval, external identity lookup, and guest account promotion.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup:
      "Run core/db/schema.sql to create the users, auth_identities, and related indexes. The users table stores the is_guest flag. The auth_identities table stores verified external identities and enforces uniqueness on provider and provider_account_id.",
    implemented: true,
    code: `import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const sql = neon(databaseUrl);

export interface AuthUser {
  id: string;
  is_guest: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VerifiedIdentity {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  emailVerified: boolean;
}

export interface AuthIdentity {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  email: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createGuestUser(): Promise<AuthUser> {
  const rows = await sql\`
    INSERT INTO users (is_guest)
    VALUES (TRUE)
    RETURNING id, is_guest, created_at, updated_at
  \`;

  const user = rows[0] as AuthUser | undefined;

  if (!user) {
    throw new Error("Failed to create guest user");
  }

  return user;
}

export async function getUserById(
  userId: string
): Promise<AuthUser | null> {
  const rows = await sql\`
    SELECT id, is_guest, created_at, updated_at
    FROM users
    WHERE id = \${userId}
    LIMIT 1
  \`;

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function getIdentityByProviderAccount(
  provider: string,
  providerAccountId: string
): Promise<AuthIdentity | null> {
  const rows = await sql\`
    SELECT
      id,
      user_id,
      provider,
      provider_account_id,
      email,
      email_verified,
      created_at,
      updated_at
    FROM auth_identities
    WHERE provider = \${provider.trim().toLowerCase()}
      AND provider_account_id = \${providerAccountId.trim()}
    LIMIT 1
  \`;

  return (rows[0] as AuthIdentity | undefined) ?? null;
}

// The production implementation also validates identity fields
// and promotes the guest account using a database statement.
export async function promoteGuestAccount(
  userId: string,
  identity: VerifiedIdentity
): Promise<AuthUser> {
  // Use the complete implementation in core/lib/auth-db.ts.
  // The identity must already be verified server-side.
  void userId;
  void identity;

  throw new Error(
    "Use the complete promoteGuestAccount implementation from core/lib/auth-db.ts"
  );
}
`,
  },
];
