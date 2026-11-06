import "server-only";

import { isIP } from "node:net";
import { domainToASCII } from "node:url";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

const sql = neon(databaseUrl);

export type OidcTenant = {
  id: string;
  domain: string;
  issuer: string;
  enabled: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export type OidcUserProfile = {
  issuer: string;
  subject: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  imageUrl: string | null;
};

type TenantRow = {
  id: string;
  domain: string;
  issuer: string;
  enabled: boolean;
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  created_at: Date | string;
};

// Converts a query result into a typed row array.
// Neon returns rows as records, so the result is narrowed here  rather than passing unsupported generic arguments to sql.
function asRows<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    throw new Error("Unexpected database query result");
  }

  return value as T[];
}

function mapTenant(row: TenantRow): OidcTenant {
  return {
    id: row.id,
    domain: row.domain,
    issuer: row.issuer,
    enabled: row.enabled,
  };
}

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    imageUrl: row.image_url,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
}

// Converts an email domain into a normalized ASCII domain.
// IP addresses, localhost, and malformed domains are rejected.
export function normalizeEmailDomain(value: string): string {
  const input = value.trim().toLowerCase();

  if (
    !input ||
    input.endsWith(".") ||
    input.includes("/") ||
    input.includes("@") ||
    input.includes(":") ||
    /\s/.test(input)
  ) {
    throw new Error("Invalid email domain");
  }

  const domain = domainToASCII(input).toLowerCase();

  if (
    !domain ||
    domain.length > 253 ||
    isIP(domain) ||
    domain === "localhost"
  ) {
    throw new Error("Invalid email domain");
  }

  const labels = domain.split(".");

  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        label.length < 1 ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  ) {
    throw new Error("Invalid email domain");
  }

  return domain;
}

export function getEmailDomain(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const separator = normalizedEmail.lastIndexOf("@");

  if (
    separator <= 0 ||
    separator === normalizedEmail.length - 1 ||
    normalizedEmail.indexOf("@") !== separator
  ) {
    throw new Error("Invalid email address");
  }

  return normalizeEmailDomain(normalizedEmail.slice(separator + 1));
}

export async function findEnabledTenantByDomain(
  domain: string,
): Promise<OidcTenant | null> {
  const normalizedDomain = normalizeEmailDomain(domain);

  const result = await sql`
    SELECT id, domain, issuer, enabled
    FROM oidc_tenants
    WHERE domain = ${normalizedDomain}
      AND enabled = TRUE
    LIMIT 1
  `;

  const rows = asRows<TenantRow>(result);

  return rows[0] ? mapTenant(rows[0]) : null;
}

export async function findEnabledTenantById(
  id: string,
): Promise<OidcTenant | null> {
  const result = await sql`
    SELECT id, domain, issuer, enabled
    FROM oidc_tenants
    WHERE id = ${id}
      AND enabled = TRUE
    LIMIT 1
  `;

  const rows = asRows<TenantRow>(result);

  return rows[0] ? mapTenant(rows[0]) : null;
}

export async function findUserByOidcIdentity(
  issuer: string,
  subject: string,
): Promise<AuthUser | null> {
  const result = await sql`
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url,
      users.created_at
    FROM oidc_accounts
    INNER JOIN users ON users.id = oidc_accounts.user_id
    WHERE oidc_accounts.issuer = ${issuer}
      AND oidc_accounts.subject = ${subject}
    LIMIT 1
  `;

  const rows = asRows<UserRow>(result);

  return rows[0] ? mapUser(rows[0]) : null;
}

// Gets the user for an existing OIDC identity or creates a new user and identity record.
// The advisory transaction lock serializes creation attempts for the same issuer/subject pair, preventing concurrent logins from creating duplicate users for that identity.
// Email must already have been verified by the OIDC ID token validator.
// Existing accounts are never linked by matching email alone.
export async function getOrCreateOidcUser(
  profile: OidcUserProfile,
): Promise<AuthUser> {
  const issuer = profile.issuer.trim();
  const subject = profile.subject.trim();
  const email = profile.email.trim().toLowerCase();

  if (!issuer || !subject || !email || !profile.emailVerified) {
    throw new Error("A verified OIDC identity is required");
  }

  getEmailDomain(email);

  const result = await sql`
    WITH identity_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(
        hashtextextended(${issuer} || ':' || ${subject}, 0)
      )
    ),
    existing_account AS MATERIALIZED (
      SELECT oidc_accounts.user_id
      FROM oidc_accounts
      CROSS JOIN identity_lock
      WHERE oidc_accounts.issuer = ${issuer}
        AND oidc_accounts.subject = ${subject}
      LIMIT 1
    ),
    created_user AS (
      INSERT INTO users (email, name, image_url)
      SELECT ${email}, ${profile.name}, ${profile.imageUrl}
      WHERE NOT EXISTS (
        SELECT 1 FROM existing_account
      )
      RETURNING id
    ),
    created_account AS (
      INSERT INTO oidc_accounts (
        user_id,
        issuer,
        subject,
        email,
        email_verified
      )
      SELECT
        created_user.id,
        ${issuer},
        ${subject},
        ${email},
        TRUE
      FROM created_user
      ON CONFLICT (issuer, subject) DO NOTHING
      RETURNING user_id
    ),
    resolved_user AS (
      SELECT user_id FROM existing_account

      UNION ALL

      SELECT user_id FROM created_account
    )
    SELECT
      users.id,
      users.email,
      users.name,
      users.image_url,
      users.created_at
    FROM resolved_user
    INNER JOIN users ON users.id = resolved_user.user_id
    LIMIT 1
  `;

  const rows = asRows<UserRow>(result);

  if (!rows[0]) {
    throw new Error("Unable to resolve OIDC account");
  }

  return mapUser(rows[0]);
}

export async function findUserById(
  userId: string,
): Promise<AuthUser | null> {
  const result = await sql`
    SELECT id, email, name, image_url, created_at
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  const rows = asRows<UserRow>(result);

  return rows[0] ? mapUser(rows[0]) : null;
}
