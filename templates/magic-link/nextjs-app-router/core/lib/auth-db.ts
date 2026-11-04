import { neon } from "@neondatabase/serverless";

export interface AuthUser {
  id: string;
  email: string;
}

export interface CreateMagicLinkTokenInput {
  email: string;
  tokenHash: string;
  expiresAt: Date;
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl);
}

export async function createMagicLinkToken(
  input: CreateMagicLinkTokenInput,
): Promise<void> {
  const sql = getSql();

  await sql`
    WITH consumed AS (
      UPDATE magic_link_tokens
      SET consumed_at = NOW()
      WHERE email = ${input.email}
        AND consumed_at IS NULL
      RETURNING id
    )
    INSERT INTO magic_link_tokens (email, token_hash, expires_at)
    VALUES (${input.email}, ${input.tokenHash}, ${input.expiresAt.toISOString()})
  `;
}

export async function consumeMagicLinkToken(
  email: string,
  tokenHash: string,
): Promise<boolean> {
  const sql = getSql();

  const rows = await sql`
    UPDATE magic_link_tokens
    SET consumed_at = NOW()
    WHERE email = ${email}
      AND token_hash = ${tokenHash}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    RETURNING id
  `;

  return rows.length === 1;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT id::text AS id, email
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  return rows.length ? (rows[0] as AuthUser) : null;
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT id::text AS id, email
    FROM users
    WHERE id = ${id}::uuid
    LIMIT 1
  `;

  return rows.length ? (rows[0] as AuthUser) : null;
}

export async function createUser(email: string): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    INSERT INTO users (email)
    VALUES (${email})
    ON CONFLICT (email) DO NOTHING
    RETURNING id::text AS id, email
  `;

  return rows.length ? (rows[0] as AuthUser) : null;
}

export async function consumeMagicLinkRateLimit(
  email: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  if (
    !Number.isInteger(maxRequests) ||
    maxRequests < 1 ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds < 1
  ) {
    throw new Error("Invalid rate-limit configuration.");
  }

  const sql = getSql();

  const rows = await sql`
    INSERT INTO magic_link_rate_limits (
      email,
      window_started_at,
      request_count
    )
    VALUES (
      ${email},
      NOW(),
      1
    )
    ON CONFLICT (email) DO UPDATE
    SET
      window_started_at = CASE
        WHEN magic_link_rate_limits.window_started_at
          <= NOW() - (${windowSeconds} * INTERVAL '1 second')
        THEN NOW()
        ELSE magic_link_rate_limits.window_started_at
      END,
      request_count = CASE
        WHEN magic_link_rate_limits.window_started_at
          <= NOW() - (${windowSeconds} * INTERVAL '1 second')
        THEN 1
        ELSE magic_link_rate_limits.request_count + 1
      END
    WHERE
      magic_link_rate_limits.window_started_at
        <= NOW() - (${windowSeconds} * INTERVAL '1 second')
      OR magic_link_rate_limits.request_count < ${maxRequests}
    RETURNING request_count
  `;

  return rows.length === 1;
}
