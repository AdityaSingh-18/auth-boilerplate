import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { GitHubProfile } from "./github-oauth";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  email_verified: boolean;
}

type UserRow = AuthUser;

interface OAuthAccountRow {
  user_id: string;
}

let sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (sql) {
    return sql;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  sql = neon(databaseUrl);
  return sql;
}

export async function findUserById(
  userId: string
): Promise<AuthUser | null> {
  const db = getSql();

  const rows = await db`
    SELECT id, email, name, image_url, email_verified
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return (rows[0] as UserRow | undefined) ?? null;
}

export async function findUserByEmail(
  email: string
): Promise<AuthUser | null> {
  const db = getSql();

  const normalizedEmail = email.trim().toLowerCase();

  const rows = await db`
    SELECT id, email, name, image_url, email_verified
    FROM users
    WHERE LOWER(email) = ${normalizedEmail}
    LIMIT 1
  `;

  return (rows[0] as UserRow | undefined) ?? null;
}

export async function findUserByGitHubAccount(
  githubId: string
): Promise<AuthUser | null> {
  const db = getSql();

  const rows = await db`
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url,
      users.email_verified
    FROM oauth_accounts
    INNER JOIN users ON users.id = oauth_accounts.user_id
    WHERE oauth_accounts.provider = 'github'
      AND oauth_accounts.provider_account_id = ${githubId}
    LIMIT 1
  `;

  return (rows[0] as UserRow | undefined) ?? null;
}

async function createUser(
  profile: GitHubProfile
): Promise<AuthUser> {
  const db = getSql();

  const rows = await db`
    INSERT INTO users (
      email,
      name,
      image_url,
      email_verified
    )
    VALUES (
      ${profile.email},
      ${profile.name},
      ${profile.image},
      TRUE
    )
    ON CONFLICT DO NOTHING
    RETURNING id, email, name, image_url, email_verified
  `;

  const insertedUser = rows[0] as UserRow | undefined;

  if (insertedUser) {
    return insertedUser;
  }

  const existingUser = await findUserByEmail(profile.email);

  if (!existingUser) {
    throw new Error("Unable to create or retrieve the user.");
  }

  return existingUser;
}

async function linkGitHubAccount(
  userId: string,
  githubId: string
): Promise<void> {
  const db = getSql();

  await db`
    INSERT INTO oauth_accounts (
      user_id,
      provider,
      provider_account_id
    )
    VALUES (
      ${userId},
      'github',
      ${githubId}
    )
    ON CONFLICT (provider, provider_account_id) DO NOTHING
  `;

  const rows = await db`
    SELECT user_id
    FROM oauth_accounts
    WHERE provider = 'github'
      AND provider_account_id = ${githubId}
    LIMIT 1
  `;

  const account = rows[0] as OAuthAccountRow | undefined;

  if (!account || account.user_id !== userId) {
    throw new Error("This GitHub account is already linked to another user.");
  }
}

export async function getOrCreateGitHubUser(
  profile: GitHubProfile
): Promise<AuthUser> {
  if (!profile.emailVerified) {
    throw new Error("A verified GitHub email address is required.");
  }

  const existingGitHubUser = await findUserByGitHubAccount(profile.id);

  if (existingGitHubUser) {
    return existingGitHubUser;
  }

  const existingEmailUser = await findUserByEmail(profile.email);

  if (existingEmailUser && !existingEmailUser.email_verified) {
    throw new Error(
      "An account with this email already exists but is not verified."
    );
  }

  const user =
    existingEmailUser ?? (await createUser(profile));

  await linkGitHubAccount(user.id, profile.id);

  return user;
}
