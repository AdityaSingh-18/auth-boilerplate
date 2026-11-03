import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

export interface AuthUser {
  id: string;
  email: string;
}

export interface OtpChallenge {
  id: string;
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
}

export interface CreateUserInput {
  id: string;
  email: string;
}

export interface CreateOtpChallengeInput {
  email: string;
  otpHash: string;
  expiresAt: Date;
}

export interface AuthDatabase {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser | null>;

  createOtpChallenge(
    input: CreateOtpChallengeInput,
  ): Promise<OtpChallenge>;

  findActiveOtpChallenge(
    email: string,
  ): Promise<OtpChallenge | null>;

  incrementOtpAttempts(id: string): Promise<boolean>;
  consumeOtpChallenge(id: string): Promise<boolean>;

  consumeRateLimit(
    email: string,
    action: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<boolean>;
}

// Lazily initializes the Neon database connection.
function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl);
}

function mapUser(row: {
  id: string;
  email: string;
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
  };
}

function mapOtpChallenge(row: {
  id: string;
  email: string;
  otp_hash: string;
  expires_at: Date;
  attempts: number;
}): OtpChallenge {
  return {
    id: row.id,
    email: row.email,
    otpHash: row.otp_hash,
    expiresAt: row.expires_at,
    attempts: row.attempts,
  };
}

// Finds a user by normalized email address.
export async function findUserByEmail(
  email: string,
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT id, email
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  return rows.length > 0
    ? mapUser(rows[0] as { id: string; email: string })
    : null;
}

// Finds a user by ID.
export async function findUserById(
  id: string,
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT id, email
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows.length > 0
    ? mapUser(rows[0] as { id: string; email: string })
    : null;
}

// Creates a user without duplicating an existing email address.
export async function createUser(
  input: CreateUserInput,
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    INSERT INTO users (id, email)
    VALUES (${input.id}, ${input.email})
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email
  `;

  return rows.length > 0
    ? mapUser(rows[0] as { id: string; email: string })
    : null;
}

// Creates a new OTP challenge and invalidates previous unused challenges.
export async function createOtpChallenge(
  input: CreateOtpChallengeInput,
): Promise<OtpChallenge> {
  const sql = getSql();
  const id = randomUUID();

  const rows = await sql`
    WITH invalidated AS (
      UPDATE email_otp_challenges
      SET consumed_at = NOW()
      WHERE email = ${input.email}
        AND consumed_at IS NULL
      RETURNING id
    )
    INSERT INTO email_otp_challenges (
      id,
      email,
      otp_hash,
      expires_at
    )
    VALUES (
      ${id},
      ${input.email},
      ${input.otpHash},
      ${input.expiresAt}
    )
    RETURNING id, email, otp_hash, expires_at, attempts
  `;

  return mapOtpChallenge(
    rows[0] as {
      id: string;
      email: string;
      otp_hash: string;
      expires_at: Date;
      attempts: number;
    },
  );
}

// Finds the latest valid OTP challenge for an email address.
export async function findActiveOtpChallenge(
  email: string,
): Promise<OtpChallenge | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT id, email, otp_hash, expires_at, attempts
    FROM email_otp_challenges
    WHERE email = ${email}
      AND expires_at > NOW()
      AND consumed_at IS NULL
      AND attempts < 5
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return rows.length > 0
    ? mapOtpChallenge(
        rows[0] as {
          id: string;
          email: string;
          otp_hash: string;
          expires_at: Date;
          attempts: number;
        },
      )
    : null;
}

// Atomically increments failed verification attempts.
export async function incrementOtpAttempts(
  id: string,
): Promise<boolean> {
  const sql = getSql();

  const rows = await sql`
    UPDATE email_otp_challenges
    SET attempts = attempts + 1
    WHERE id = ${id}
      AND consumed_at IS NULL
      AND expires_at > NOW()
      AND attempts < 5
    RETURNING id
  `;

  return rows.length > 0;
}

// Atomically consumes an OTP challenge.
// A challenge can only be consumed once.
export async function consumeOtpChallenge(
  id: string,
): Promise<boolean> {
  const sql = getSql();

  const rows = await sql`
    UPDATE email_otp_challenges
    SET consumed_at = NOW()
    WHERE id = ${id}
      AND consumed_at IS NULL
      AND expires_at > NOW()
      AND attempts < 5
    RETURNING id
  `;

  return rows.length > 0;
}

// Atomically records and checks a persistent rate limit.
export async function consumeRateLimit(
  email: string,
  action: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  if (
    !Number.isInteger(maxRequests) ||
    maxRequests < 1 ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds < 1
  ) {
    throw new Error("Invalid rate limit configuration.");
  }

  const sql = getSql();

  const rows = await sql`
    INSERT INTO email_otp_rate_limits (
      id,
      email,
      action,
      window_started_at,
      request_count
    )
    VALUES (
      ${randomUUID()},
      ${email},
      ${action},
      NOW(),
      1
    )
    ON CONFLICT (email, action)
    DO UPDATE SET
      request_count = CASE
        WHEN email_otp_rate_limits.window_started_at
          <= NOW() - (${windowSeconds} * INTERVAL '1 second')
        THEN 1
        ELSE email_otp_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN email_otp_rate_limits.window_started_at
          <= NOW() - (${windowSeconds} * INTERVAL '1 second')
        THEN NOW()
        ELSE email_otp_rate_limits.window_started_at
      END
    RETURNING request_count
  `;

  return Number(rows[0]?.request_count) <= maxRequests;
}
