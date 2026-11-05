import { neon } from "@neondatabase/serverless";
import type { XProfile } from "./x-oauth";

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  email_verified: boolean;
}

const PROVIDER = "x";

let database: ReturnType<typeof neon> | null = null;

function getDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  if (!database) {
    database = neon(connectionString);
  }

  return database;
}

function firstRow<T>(result: unknown): T | null {
  if (!Array.isArray(result) || result.length === 0) {
    return null;
  }

  return result[0] as T;
}

export async function findUserById(
  userId: string
): Promise<AuthUser | null> {
  const sql = getDatabase();

  const result: unknown = await sql`
    SELECT
      id,
      email,
      name,
      image_url,
      email_verified
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return firstRow<AuthUser>(result);
}

export async function findUserByXAccount(
  providerAccountId: string
): Promise<AuthUser | null> {
  const sql = getDatabase();

  const result: unknown = await sql`
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url,
      users.email_verified
    FROM users
    INNER JOIN oauth_accounts
      ON oauth_accounts.user_id = users.id
    WHERE oauth_accounts.provider = ${PROVIDER}
      AND oauth_accounts.provider_account_id = ${providerAccountId}
    LIMIT 1
  `;

  return firstRow<AuthUser>(result);
}

export async function createUser(
  profile: XProfile
): Promise<AuthUser> {
  const sql = getDatabase();

  const result: unknown = await sql`
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
      ${profile.emailVerified}
    )
    RETURNING
      id,
      email,
      name,
      image_url,
      email_verified
  `;

  const user = firstRow<AuthUser>(result);

  if (!user) {
    throw new Error("Failed to create the user.");
  }

  return user;
}

export async function linkXAccount(
  userId: string,
  providerAccountId: string
): Promise<void> {
  const sql = getDatabase();

  await sql`
    INSERT INTO oauth_accounts (
      user_id,
      provider,
      provider_account_id
    )
    VALUES (
      ${userId},
      ${PROVIDER},
      ${providerAccountId}
    )
    ON CONFLICT (provider, provider_account_id)
    DO NOTHING
  `;

  const result: unknown = await sql`
    SELECT user_id
    FROM oauth_accounts
    WHERE provider = ${PROVIDER}
      AND provider_account_id = ${providerAccountId}
    LIMIT 1
  `;

  const account = firstRow<{ user_id: string }>(result);

  if (!account || account.user_id !== userId) {
    throw new Error(
      "This X account is already linked to another user."
    );
  }
}

export async function getOrCreateXUser(
  profile: XProfile
): Promise<AuthUser> {
  const existingUser = await findUserByXAccount(profile.id);

  if (existingUser) {
    return existingUser;
  }

  const newUser = await createUser(profile);

  await linkXAccount(newUser.id, profile.id);

  return newUser;
}
