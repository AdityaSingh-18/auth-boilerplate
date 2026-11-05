import { neon } from "@neondatabase/serverless";
import type { FacebookProfile } from "./facebook-oauth";

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  email_verified: boolean;
}

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  email_verified: boolean;
}

interface OAuthAccountRow {
  user_id: string;
}

let sql: ReturnType<typeof neon> | null = null;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing environment variable: DATABASE_URL");
  }

  if (!sql) {
    sql = neon(databaseUrl);
  }

  return sql;
}

function firstRow<T>(result: unknown): T | undefined {
  if (!Array.isArray(result)) {
    return undefined;
  }

  return result[0] as T | undefined;
}

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image_url: row.image_url,
    email_verified: row.email_verified,
  };
}

export async function findUserByFacebookAccount(
  facebookUserId: string,
): Promise<AuthUser | null> {
  const db = getSql();

  const rows = await db`
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url,
      users.email_verified
    FROM users
    INNER JOIN oauth_accounts
      ON oauth_accounts.user_id = users.id
    WHERE oauth_accounts.provider = 'facebook'
      AND oauth_accounts.provider_account_id = ${facebookUserId}
    LIMIT 1
  `;

  const user = firstRow<UserRow>(rows);

  return user ? mapUser(user) : null;
}

export async function findUserByEmail(
  email: string,
): Promise<AuthUser | null> {
  const db = getSql();

  const rows = await db`
    SELECT
      id,
      email,
      name,
      image_url,
      email_verified
    FROM users
    WHERE LOWER(email) = ${email.toLowerCase()}
    LIMIT 1
  `;

  const user = firstRow<UserRow>(rows);

  return user ? mapUser(user) : null;
}

async function createUser(
  profile: FacebookProfile,
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
      FALSE
    )
    RETURNING
      id,
      email,
      name,
      image_url,
      email_verified
  `;

  const user = firstRow<UserRow>(rows);

  if (!user) {
    throw new Error("Failed to create user.");
  }

  return mapUser(user);
}

async function linkFacebookAccount(
  userId: string,
  facebookUserId: string,
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
      'facebook',
      ${facebookUserId}
    )
    ON CONFLICT (provider, provider_account_id)
    DO NOTHING
  `;

  const rows = await db`
    SELECT user_id
    FROM oauth_accounts
    WHERE provider = 'facebook'
      AND provider_account_id = ${facebookUserId}
    LIMIT 1
  `;

  const account = firstRow<OAuthAccountRow>(rows);

  if (!account || account.user_id !== userId) {
    throw new Error(
      "This Facebook account is already linked to another user.",
    );
  }
}

export async function getOrCreateFacebookUser(
  profile: FacebookProfile,
): Promise<AuthUser> {
  const existingFacebookUser = await findUserByFacebookAccount(
    profile.id,
  );

  if (existingFacebookUser) {
    return existingFacebookUser;
  }

  // Never automatically link an existing account using Facebook email.
  if (profile.email) {
    const existingEmailUser = await findUserByEmail(profile.email);

    if (existingEmailUser) {
      throw new Error(
        "An account with this email already exists. Sign in using your existing method before linking Facebook.",
      );
    }
  }

  const user = await createUser(profile);

  await linkFacebookAccount(user.id, profile.id);

  return user;
}