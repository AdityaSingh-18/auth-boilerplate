import { neon } from "@neondatabase/serverless";
import type { AppleProfile } from "./apple-oauth";

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  email_verified: boolean;
}

type UserRow = AuthUser;

interface OAuthAccountRow {
  user_id: string;
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL.");
  }

  return neon(databaseUrl);
}

export async function findUserById(
  userId: string
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT id, email, name, image_url, email_verified
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return (rows[0] as UserRow | undefined) ?? null;
}

export async function findUserByAppleAccount(
  appleAccountId: string
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT u.id, u.email, u.name, u.image_url, u.email_verified
    FROM oauth_accounts a
    JOIN users u ON u.id = a.user_id
    WHERE a.provider = 'apple'
      AND a.provider_account_id = ${appleAccountId}
    LIMIT 1
  `;

  return (rows[0] as UserRow | undefined) ?? null;
}

async function createUser(
  profile: AppleProfile,
  name: string | null
): Promise<AuthUser> {
  const sql = getSql();

  const rows = await sql`
    INSERT INTO users (
      email,
      name,
      email_verified
    )
    VALUES (
      ${profile.email},
      ${name},
      ${profile.emailVerified}
    )
    ON CONFLICT DO NOTHING
    RETURNING id, email, name, image_url, email_verified
  `;

  if (rows[0]) {
    return rows[0] as UserRow;
  }

  // An email may already belong to another application account.
  // Do not automatically link accounts based on matching email.
  const fallbackRows = await sql`
    INSERT INTO users (
      email,
      name,
      email_verified
    )
    VALUES (
      NULL,
      ${name},
      FALSE
    )
    RETURNING id, email, name, image_url, email_verified
  `;

  if (!fallbackRows[0]) {
    throw new Error("Failed to create application user.");
  }

  return fallbackRows[0] as UserRow;
}

async function linkAppleAccount(
  userId: string,
  appleAccountId: string
): Promise<void> {
  const sql = getSql();

  await sql`
    INSERT INTO oauth_accounts (
      user_id,
      provider,
      provider_account_id
    )
    VALUES (
      ${userId},
      'apple',
      ${appleAccountId}
    )
    ON CONFLICT (provider, provider_account_id) DO NOTHING
  `;

  const rows = await sql`
    SELECT user_id
    FROM oauth_accounts
    WHERE provider = 'apple'
      AND provider_account_id = ${appleAccountId}
    LIMIT 1
  `;

  const account = rows[0] as OAuthAccountRow | undefined;

  if (!account || account.user_id !== userId) {
    throw new Error("Apple account is already linked to another user.");
  }
}

export async function getOrCreateAppleUser(
  profile: AppleProfile,
  name: string | null
): Promise<AuthUser> {
  const existingUser = await findUserByAppleAccount(profile.id);

  if (existingUser) {
    return existingUser;
  }

  const user = await createUser(profile, name);

  await linkAppleAccount(user.id, profile.id);

  return user;
}