import "server-only";

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(databaseUrl);

export interface SamlUser {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string | Date;
}

interface UserIdRow {
  user_id: string;
}

function asRows<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as T[];
}

function mapUser(row: UserRow): SamlUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function findUserBySamlIdentity(
  idpIssuer: string,
  nameId: string,
): Promise<SamlUser | null> {
  const result: unknown = await sql`
    SELECT
      users.id,
      users.email,
      users.name,
      users.created_at
    FROM saml_accounts
    INNER JOIN users
      ON users.id = saml_accounts.user_id
    WHERE saml_accounts.idp_issuer = ${idpIssuer}
      AND saml_accounts.name_id = ${nameId}
    LIMIT 1
  `;

  const rows = asRows<UserRow>(result);

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getOrCreateSamlUser(input: {
  idpIssuer: string;
  nameId: string;
  nameIdFormat?: string | null;
  email?: string | null;
  name?: string | null;
}): Promise<SamlUser> {
  const idpIssuer = input.idpIssuer.trim();
  const nameId = input.nameId.trim();

  if (!idpIssuer || !nameId) {
    throw new Error("A SAML issuer and NameID are required.");
  }

  const email = input.email?.trim().toLowerCase() || null;
  const name = input.name?.trim() || null;
  const nameIdFormat = input.nameIdFormat?.trim() || null;

  // The advisory transaction lock serializes creation attempts for the
  // same external identity. The unique constraint remains the final guard.
  const result: unknown = await sql`
    WITH identity_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(
        hashtextextended(${`${idpIssuer}\u0000${nameId}`}, 0)
      )
    ),
    existing_identity AS (
      SELECT saml_accounts.user_id
      FROM saml_accounts, identity_lock
      WHERE saml_accounts.idp_issuer = ${idpIssuer}
        AND saml_accounts.name_id = ${nameId}
      LIMIT 1
    ),
    inserted_user AS (
      INSERT INTO users (email, name)
      SELECT ${email}, ${name}
      FROM identity_lock
      WHERE NOT EXISTS (
        SELECT 1 FROM existing_identity
      )
      RETURNING id
    ),
    selected_user AS (
      SELECT user_id AS id FROM existing_identity
      UNION ALL
      SELECT id FROM inserted_user
      LIMIT 1
    ),
    inserted_account AS (
      INSERT INTO saml_accounts (
        user_id,
        idp_issuer,
        name_id,
        name_id_format
      )
      SELECT
        selected_user.id,
        ${idpIssuer},
        ${nameId},
        ${nameIdFormat}
      FROM selected_user
      WHERE NOT EXISTS (
        SELECT 1 FROM existing_identity
      )
      ON CONFLICT (idp_issuer, name_id) DO NOTHING
      RETURNING user_id
    )
    SELECT user_id FROM inserted_account
    UNION ALL
    SELECT user_id FROM existing_identity
    LIMIT 1
  `;

  const rows = asRows<UserIdRow>(result);
  const userId = rows[0]?.user_id;

  if (!userId) {
    // Defensive fallback in case another request created the identity
    // between database operations or a database constraint was reached.
    const existingUser = await findUserBySamlIdentity(idpIssuer, nameId);

    if (!existingUser) {
      throw new Error("Unable to create or retrieve the SAML user.");
    }

    return existingUser;
  }

  const userResult: unknown = await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  const userRows = asRows<UserRow>(userResult);

  if (!userRows[0]) {
    throw new Error("The SAML user could not be loaded.");
  }

  return mapUser(userRows[0]);
}

export async function findUserById(
  userId: string,
): Promise<SamlUser | null> {
  const result: unknown = await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  const rows = asRows<UserRow>(result);

  return rows[0] ? mapUser(rows[0]) : null;
}
