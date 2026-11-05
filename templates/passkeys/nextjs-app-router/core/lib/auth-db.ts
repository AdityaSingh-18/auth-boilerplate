import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

export const sql = neon(process.env.DATABASE_URL);

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

export interface PasskeyRecord {
  credential_id: string;
  user_id: string;
  public_key: string;
  counter: number | string;
  transports: string[];
  device_type: string | null;
  backed_up: boolean;
}

export async function getUserById(
  userId: string,
): Promise<AuthUser | null> {
  const rows = await sql`
    SELECT id, email, name
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function getUserPasskeys(
  userId: string,
): Promise<PasskeyRecord[]> {
  return (await sql`
    SELECT
      credential_id,
      user_id,
      public_key,
      counter,
      transports,
      device_type,
      backed_up
    FROM passkey_credentials
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
  `) as PasskeyRecord[];
}

export async function getPasskeyByCredentialId(
  id: string,
): Promise<PasskeyRecord | null> {
  const rows = await sql`
    SELECT
      credential_id,
      user_id,
      public_key,
      counter,
      transports,
      device_type,
      backed_up
    FROM passkey_credentials
    WHERE credential_id = ${id}
    LIMIT 1
  `;

  return (rows[0] as PasskeyRecord | undefined) ?? null;
}

export async function storePasskey(input: {
  credentialId: string;
  userId: string;
  publicKey: Uint8Array;
  counter: number;
  transports?: string[];
  deviceType?: string;
  backedUp?: boolean;
}): Promise<void> {
  const publicKey = Buffer.from(input.publicKey).toString("base64url");

  const inserted = await sql`
    INSERT INTO passkey_credentials (
      credential_id,
      user_id,
      public_key,
      counter,
      transports,
      device_type,
      backed_up
    )
    SELECT
      ${input.credentialId},
      users.id,
      ${publicKey},
      ${input.counter},
      ${input.transports ?? []},
      ${input.deviceType ?? null},
      ${input.backedUp ?? false}
    FROM users
    WHERE users.id = ${input.userId}
    ON CONFLICT (credential_id) DO NOTHING
    RETURNING user_id
  `;

  if (inserted.length > 0) {
    return;
  }

  const existing = await getPasskeyByCredentialId(input.credentialId);

  if (existing) {
    if (existing.user_id === input.userId) {
      throw new Error("This passkey is already registered to this account.");
    }

    throw new Error("This credential is already registered to another account.");
  }

  const user = await getUserById(input.userId);

  if (!user) {
    throw new Error("Cannot register a passkey for a user that does not exist.");
  }

  throw new Error("Could not save the passkey.");
}

/**
 * Updates a credential counter only if it still matches the value
 * read before verification.
 *
 * This prevents concurrent authentication requests from silently
 * overwriting a newer counter value.
 */
export async function updatePasskeyCounter(
  id: string,
  expectedCounter: number,
  newCounter: number,
): Promise<{ user_id: string } | null> {
  const rows = await sql`
    UPDATE passkey_credentials
    SET
      counter = ${newCounter},
      last_used_at = NOW()
    WHERE credential_id = ${id}
      AND counter = ${expectedCounter}
    RETURNING user_id
  `;

  return (rows[0] as { user_id: string } | undefined) ?? null;
}

export async function findActiveChallenge(
  challenge: string,
  purpose: "registration" | "authentication",
): Promise<{ user_id: string | null } | null> {
  const rows = await sql`
    SELECT user_id
    FROM passkey_challenges
    WHERE challenge = ${challenge}
      AND purpose = ${purpose}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;

  return (rows[0] as { user_id: string | null } | undefined) ?? null;
}

/**
 * Atomically consumes a challenge.
 * Only one request can successfully consume a challenge.
 */
export async function consumeChallenge(
  challenge: string,
  purpose: "registration" | "authentication",
): Promise<{ user_id: string | null } | null> {
  const rows = await sql`
    UPDATE passkey_challenges
    SET consumed_at = NOW()
    WHERE challenge = ${challenge}
      AND purpose = ${purpose}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    RETURNING user_id
  `;

  return (rows[0] as { user_id: string | null } | undefined) ?? null;
}
