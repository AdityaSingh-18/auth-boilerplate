import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

export interface AuthUser {
  id: string;
  phone: string;
}

export interface OtpChallenge {
  id: string;
  phone: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl);
}

export async function findUserByPhone(
  phone: string,
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT id::text, phone
    FROM users
    WHERE phone = ${phone}
    LIMIT 1
  `;

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function findUserById(
  id: string,
): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT id::text, phone
    FROM users
    WHERE id = ${id}::uuid
    LIMIT 1
  `;

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function createUser(input: {
  id: string;
  phone: string;
}): Promise<AuthUser | null> {
  const sql = getSql();

  const rows = await sql`
    INSERT INTO users (id, phone)
    VALUES (${input.id}::uuid, ${input.phone})
    ON CONFLICT (phone) DO NOTHING
    RETURNING id::text, phone
  `;

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function createOtpChallenge(input: {
  phone: string;
  otpHash: string;
  expiresAt: Date;
}): Promise<OtpChallenge> {
  const sql = getSql();
  const id = randomUUID();

  const rows = await sql`
    WITH consumed AS (
      UPDATE sms_otp_challenges
      SET consumed_at = NOW()
      WHERE phone = ${input.phone}
        AND consumed_at IS NULL
      RETURNING id
    )
    INSERT INTO sms_otp_challenges (
      id,
      phone,
      otp_hash,
      expires_at
    )
    VALUES (
      ${id}::uuid,
      ${input.phone},
      ${input.otpHash},
      ${input.expiresAt.toISOString()}::timestamptz
    )
    RETURNING
      id::text,
      phone,
      otp_hash AS "otpHash",
      expires_at AS "expiresAt",
      attempts
  `;

  const row = rows[0] as
    | (Omit<OtpChallenge, "expiresAt"> & {
        expiresAt: string | Date;
      })
    | undefined;

  if (!row) {
    throw new Error("Failed to create OTP challenge.");
  }

  return {
    ...row,
    expiresAt: new Date(row.expiresAt),
  };
}

export async function findActiveOtpChallenge(
  phone: string,
): Promise<OtpChallenge | null> {
  const sql = getSql();

  const rows = await sql`
    SELECT
      id::text,
      phone,
      otp_hash AS "otpHash",
      expires_at AS "expiresAt",
      attempts
    FROM sms_otp_challenges
    WHERE phone = ${phone}
      AND consumed_at IS NULL
      AND expires_at > NOW()
      AND attempts < 5
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const row = rows[0] as
    | (Omit<OtpChallenge, "expiresAt"> & {
        expiresAt: string | Date;
      })
    | undefined;

  return row
    ? {
        ...row,
        expiresAt: new Date(row.expiresAt),
      }
    : null;
}

export async function incrementOtpAttempts(
  id: string,
): Promise<boolean> {
  const sql = getSql();

  const rows = await sql`
    UPDATE sms_otp_challenges
    SET attempts = attempts + 1
    WHERE id = ${id}::uuid
      AND consumed_at IS NULL
      AND expires_at > NOW()
      AND attempts < 5
    RETURNING id
  `;

  return rows.length > 0;
}

export async function consumeOtpChallenge(
  id: string,
): Promise<boolean> {
  const sql = getSql();

  const rows = await sql`
    UPDATE sms_otp_challenges
    SET consumed_at = NOW()
    WHERE id = ${id}::uuid
      AND consumed_at IS NULL
      AND expires_at > NOW()
      AND attempts < 5
    RETURNING id
  `;

  return rows.length > 0;
}

export async function consumeRateLimit(
  phone: string,
  action: "request" | "verify",
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
    INSERT INTO sms_otp_rate_limits (
      phone,
      action,
      request_count,
      window_started_at
    )
    VALUES (
      ${phone},
      ${action},
      1,
      NOW()
    )
    ON CONFLICT (phone, action)
    DO UPDATE SET
      request_count = CASE
        WHEN sms_otp_rate_limits.window_started_at
          <= NOW() - (${windowSeconds} * INTERVAL '1 second')
        THEN 1
        ELSE sms_otp_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN sms_otp_rate_limits.window_started_at
          <= NOW() - (${windowSeconds} * INTERVAL '1 second')
        THEN NOW()
        ELSE sms_otp_rate_limits.window_started_at
      END
    WHERE
      sms_otp_rate_limits.window_started_at
        <= NOW() - (${windowSeconds} * INTERVAL '1 second')
      OR sms_otp_rate_limits.request_count < ${maxRequests}
    RETURNING phone
  `;

  return rows.length > 0;
}

export async function invalidateOtpChallenge(
  id: string,
): Promise<void> {
  const sql = getSql();

  await sql`
    UPDATE sms_otp_challenges
    SET consumed_at = NOW()
    WHERE id = ${id}::uuid
      AND consumed_at IS NULL
  `;
}
