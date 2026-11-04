import { neon } from "@neondatabase/serverless";
import type { DiscordProfile } from "./discord-oauth";

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

const sql = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing environment variable: DATABASE_URL");
  }

  return neon(process.env.DATABASE_URL);
};

async function findUserByEmail(
  email: string,
): Promise<AuthUser | null> {
  const db = sql();

  const rows = await db`
    SELECT id, email, name, image_url, email_verified
    FROM users
    WHERE LOWER(email) = ${email.toLowerCase()}
    LIMIT 1
  `;

  return (rows[0] as UserRow | undefined) ?? null;
}

export async function findUserById(
  userId: string,
): Promise<AuthUser | null> {
  const db = sql();

  const rows = await db`
    SELECT id, email, name, image_url, email_verified
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return (rows[0] as UserRow | undefined) ?? null;
}

async function findUserByDiscordAccount(
  discordId: string,
): Promise<AuthUser | null> {
  const db = sql();

  const rows = await db`
    SELECT
      u.id,
      u.email,
      u.name,
      u.image_url,
      u.email_verified
    FROM users u
    INNER JOIN oauth_accounts a ON a.user_id = u.id
    WHERE a.provider = 'discord'
      AND a.provider_account_id = ${discordId}
    LIMIT 1
  `;

  return (rows[0] as UserRow | undefined) ?? null;
}

async function createUser(
  profile: DiscordProfile,
): Promise<AuthUser> {
  const db = sql();

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

  const createdUser = rows[0] as UserRow | undefined;

  if (createdUser) {
    return createdUser;
  }

  const existingUser = await findUserByEmail(profile.email);

  if (!existingUser) {
    throw new Error("Unable to create or find the application user");
  }

  return existingUser;
}

async function linkDiscordAccount(
  userId: string,
  discordId: string,
): Promise<void> {
  const db = sql();

  await db`
    INSERT INTO oauth_accounts (
      user_id,
      provider,
      provider_account_id
    )
    VALUES (
      ${userId},
      'discord',
      ${discordId}
    )
    ON CONFLICT (provider, provider_account_id) DO NOTHING
  `;

  const rows = await db`
    SELECT user_id
    FROM oauth_accounts
    WHERE provider = 'discord'
      AND provider_account_id = ${discordId}
    LIMIT 1
  `;

  const account = rows[0] as OAuthAccountRow | undefined;

  if (!account || account.user_id !== userId) {
    throw new Error(
      "This Discord account is already linked to another user",
    );
  }
}

export async function getOrCreateDiscordUser(
  profile: DiscordProfile,
): Promise<AuthUser> {
  if (!profile.emailVerified) {
    throw new Error("A verified Discord email address is required");
  }

  // Check whether this Discord account is already linked.
  const linkedUser = await findUserByDiscordAccount(profile.id);

  if (linkedUser) {
    return linkedUser;
  }

  // Check whether an application account already uses this email.
  const existingUser = await findUserByEmail(profile.email);

  if (existingUser && !existingUser.email_verified) {
    throw new Error(
      "An unverified application account already uses this email",
    );
  }

  // Reuse the existing verified account or create a new one.
  const user =
    existingUser ?? (await createUser(profile));

  // Link the Discord account to the application user.
  await linkDiscordAccount(user.id, profile.id);

  return user;
}