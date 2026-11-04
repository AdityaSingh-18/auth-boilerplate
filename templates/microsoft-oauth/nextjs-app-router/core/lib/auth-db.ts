import { neon } from "@neondatabase/serverless";
import type { MicrosoftProfile } from "./microsoft-oauth";

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
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return neon(databaseUrl);
}

export async function findUserById(
  userId: string
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = (await sql`
    SELECT id, email, name, image_url, email_verified
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `) as UserRow[];

  return rows[0] ?? null;
}

export async function findUserByMicrosoftAccount(
  tenantId: string,
  microsoftAccountId: string
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = (await sql`
    SELECT users.id, users.email, users.name,
           users.image_url, users.email_verified
    FROM users
    INNER JOIN oauth_accounts
      ON oauth_accounts.user_id = users.id
    WHERE oauth_accounts.provider = 'microsoft'
      AND oauth_accounts.provider_tenant_id = ${tenantId}
      AND oauth_accounts.provider_account_id = ${microsoftAccountId}
    LIMIT 1
  `) as UserRow[];

  return rows[0] ?? null;
}

async function createUser(
  profile: MicrosoftProfile
): Promise<AuthUser> {
  const sql = getSql();

  const rows = (await sql`
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
    ON CONFLICT DO NOTHING
    RETURNING id, email, name, image_url, email_verified
  `) as UserRow[];

  if (rows[0]) {
    return rows[0];
  }

  // An email may already belong to a different application account.
  // Do not automatically link that account to this Microsoft identity.
  const fallbackRows = (await sql`
    INSERT INTO users (
      email,
      name,
      image_url,
      email_verified
    )
    VALUES (
      NULL,
      ${profile.name},
      ${profile.image},
      FALSE
    )
    RETURNING id, email, name, image_url, email_verified
  `) as UserRow[];

  if (!fallbackRows[0]) {
    throw new Error("Failed to create application user.");
  }

  return fallbackRows[0];
}

async function linkMicrosoftAccount(
  userId: string,
  tenantId: string,
  microsoftAccountId: string
): Promise<void> {
  const sql = getSql();

  await sql`
    INSERT INTO oauth_accounts (
      user_id,
      provider,
      provider_account_id,
      provider_tenant_id
    )
    VALUES (
      ${userId},
      'microsoft',
      ${microsoftAccountId},
      ${tenantId}
    )
    ON CONFLICT (
      provider,
      provider_tenant_id,
      provider_account_id
    )
    DO NOTHING
  `;

  const rows = (await sql`
    SELECT user_id
    FROM oauth_accounts
    WHERE provider = 'microsoft'
      AND provider_tenant_id = ${tenantId}
      AND provider_account_id = ${microsoftAccountId}
    LIMIT 1
  `) as OAuthAccountRow[];

  if (!rows[0] || rows[0].user_id !== userId) {
    throw new Error(
      "Microsoft account is already linked to another user."
    );
  }
}

export async function getOrCreateMicrosoftUser(
  profile: MicrosoftProfile
): Promise<AuthUser> {
  const existingUser = await findUserByMicrosoftAccount(
    profile.tenantId,
    profile.id
  );

  if (existingUser) {
    return existingUser;
  }

  const user = await createUser(profile);

  await linkMicrosoftAccount(
    user.id,
    profile.tenantId,
    profile.id
  );

  return user;
}
