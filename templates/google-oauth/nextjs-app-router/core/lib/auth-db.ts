import { neon } from "@neondatabase/serverless";
import type { GoogleProfile } from "./google-oauth";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  email_verified: boolean;
}

interface OAuthAccount {
  user_id: string;
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl);
}

export async function findUserById(
  id: string,
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT
      id::text,
      email,
      name,
      image_url,
      email_verified
    FROM users
    WHERE id = ${id}::uuid
    LIMIT 1
  `;

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function findUserByEmail(
  email: string,
): Promise<AuthUser | null> {
  const sql = getSql();

  const normalizedEmail = email.trim().toLowerCase();

  const rows = await sql`
    SELECT
      id::text,
      email,
      name,
      image_url,
      email_verified
    FROM users
    WHERE LOWER(email) = ${normalizedEmail}
    LIMIT 1
  `;

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function findUserByGoogleAccount(
  googleId: string,
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT
      users.id::text,
      users.email,
      users.name,
      users.image_url,
      users.email_verified
    FROM oauth_accounts
    INNER JOIN users
      ON users.id = oauth_accounts.user_id
    WHERE oauth_accounts.provider = 'google'
      AND oauth_accounts.provider_account_id = ${googleId}
    LIMIT 1
  `;

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function createUser(
  profile: GoogleProfile,
): Promise<AuthUser> {
  const sql = getSql();

  const rows = await sql`
    INSERT INTO users (
      email,
      name,
      image_url,
      email_verified
    )
    VALUES (
      ${profile.email},
      ${profile.name},
      ${profile.picture},
      ${profile.emailVerified}
    )
    ON CONFLICT DO NOTHING
    RETURNING
      id::text,
      email,
      name,
      image_url,
      email_verified
  `;

  if (rows[0]) {
    return rows[0] as AuthUser;
  }

  const existingUser = await findUserByEmail(profile.email);

  if (!existingUser) {
    throw new Error("Unable to create or retrieve the user.");
  }

  return existingUser;
}

export async function linkGoogleAccount(
  userId: string,
  googleId: string,
): Promise<void> {
  const sql = getSql();

  await sql`
    INSERT INTO oauth_accounts (
      user_id,
      provider,
      provider_account_id
    )
    VALUES (
      ${userId}::uuid,
      'google',
      ${googleId}
    )
    ON CONFLICT (provider, provider_account_id)
    DO NOTHING
  `;

  const linkedAccount = await sql`
    SELECT user_id::text
    FROM oauth_accounts
    WHERE provider = 'google'
      AND provider_account_id = ${googleId}
    LIMIT 1
  `;

  const account = linkedAccount[0] as
    | { user_id: string }
    | undefined;

  if (!account || account.user_id !== userId) {
    throw new Error("Google account is already linked to another user.");
  }
}

export async function getOrCreateGoogleUser(
  profile: GoogleProfile,
): Promise<AuthUser> {
  const existingGoogleUser = await findUserByGoogleAccount(
    profile.id,
  );

  if (existingGoogleUser) {
    return existingGoogleUser;
  }

  let user = await findUserByEmail(profile.email);

  if (user && !user.email_verified) {
    throw new Error(
      "An account with this email exists but its email is not verified.",
    );
  }

  if (!user) {
    user = await createUser(profile);
  }

  await linkGoogleAccount(user.id, profile.id);

  return user;
}
