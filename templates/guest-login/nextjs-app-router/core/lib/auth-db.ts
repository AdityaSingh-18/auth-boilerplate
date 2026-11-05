import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const sql = neon(databaseUrl);

export type AuthUser = {
  id: string;
  is_guest: boolean;
  created_at: Date;
  updated_at: Date;
};

export type VerifiedIdentity = {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  emailVerified: boolean;
};

export type AuthIdentity = {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  email: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
};

function normalizeIdentity(
  identity: VerifiedIdentity
): VerifiedIdentity {
  const provider = identity.provider.trim().toLowerCase();
  const providerAccountId = identity.providerAccountId.trim();
  const email = identity.email?.trim().toLowerCase() || null;

  if (!provider || !providerAccountId) {
    throw new Error("Invalid identity details");
  }

  if (provider.length > 100 || providerAccountId.length > 255) {
    throw new Error("Identity details exceed the allowed length");
  }

  if (email && email.length > 320) {
    throw new Error("Email address is too long");
  }

  return {
    provider,
    providerAccountId,
    email,
    emailVerified: identity.emailVerified,
  };
}

export async function createGuestUser(): Promise<AuthUser> {
  const rows = await sql`
    INSERT INTO users (is_guest)
    VALUES (TRUE)
    RETURNING id, is_guest, created_at, updated_at
  `;

  const user = rows[0] as AuthUser | undefined;

  if (!user) {
    throw new Error("Failed to create guest user");
  }

  return user;
}

export async function getUserById(
  userId: string
): Promise<AuthUser | null> {
  const rows = await sql`
    SELECT id, is_guest, created_at, updated_at
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function getIdentityByProviderAccount(
  provider: string,
  providerAccountId: string
): Promise<AuthIdentity | null> {
  const normalizedProvider = provider.trim().toLowerCase();
  const normalizedAccountId = providerAccountId.trim();

  if (!normalizedProvider || !normalizedAccountId) {
    return null;
  }

  const rows = await sql`
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
    WHERE provider = ${normalizedProvider}
      AND provider_account_id = ${normalizedAccountId}
    LIMIT 1
  `;

  return (rows[0] as AuthIdentity | undefined) ?? null;
}

// Promotes a guest account by linking a verified external identity.
// The identity must be verified through a trusted server-side authentication flow before calling this function.
// The guest's user ID remains unchanged.
export async function promoteGuestAccount(
  userId: string,
  identity: VerifiedIdentity
): Promise<AuthUser> {
  if (!userId.trim()) {
    throw new Error("Invalid user ID");
  }

  const normalized = normalizeIdentity(identity);

  const rows = await sql`
    WITH guest AS (
      SELECT id
      FROM users
      WHERE id = ${userId}
        AND is_guest = TRUE
      FOR UPDATE
    ),
    linked_identity AS (
      INSERT INTO auth_identities (
        user_id,
        provider,
        provider_account_id,
        email,
        email_verified
      )
      SELECT
        guest.id,
        ${normalized.provider},
        ${normalized.providerAccountId},
        ${normalized.email},
        ${normalized.emailVerified}
      FROM guest
      ON CONFLICT (provider, provider_account_id) DO NOTHING
      RETURNING user_id
    ),
    promoted AS (
      UPDATE users
      SET
        is_guest = FALSE,
        updated_at = NOW()
      WHERE id IN (
        SELECT id FROM guest
      )
      AND (
        EXISTS (
          SELECT 1
          FROM linked_identity
          WHERE linked_identity.user_id = users.id
        )
        OR EXISTS (
          SELECT 1
          FROM auth_identities
          WHERE auth_identities.user_id = users.id
            AND auth_identities.provider = ${normalized.provider}
            AND auth_identities.provider_account_id =
              ${normalized.providerAccountId}
        )
      )
      RETURNING id, is_guest, created_at, updated_at
    )
    SELECT id, is_guest, created_at, updated_at
    FROM promoted
  `;

  const promotedUser = rows[0] as AuthUser | undefined;

  if (promotedUser) {
    return promotedUser;
  }

  const existingIdentity = await getIdentityByProviderAccount(
    normalized.provider,
    normalized.providerAccountId
  );

  if (existingIdentity) {
    if (existingIdentity.user_id !== userId) {
      throw new Error(
        "This identity is already linked to another account"
      );
    }

    const existingUser = await getUserById(userId);

    if (!existingUser) {
      throw new Error("User account not found");
    }

    if (!existingUser.is_guest) {
      return existingUser;
    }

    throw new Error("Unable to promote guest account");
  }

  const currentUser = await getUserById(userId);

  if (!currentUser) {
    throw new Error("User account not found");
  }

  if (!currentUser.is_guest) {
    throw new Error("This account is already a permanent account");
  }

  throw new Error("Unable to promote guest account");
}