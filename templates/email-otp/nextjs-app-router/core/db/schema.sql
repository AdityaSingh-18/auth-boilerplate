-- Stores users authenticated through email OTP.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores hashed email OTP challenges.
CREATE TABLE IF NOT EXISTS email_otp_challenges (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT email_otp_attempts_nonnegative
    CHECK (attempts >= 0)
);

-- Supports finding the latest OTP challenge for an email.
CREATE INDEX IF NOT EXISTS idx_email_otp_email_created
ON email_otp_challenges (email, created_at DESC);

-- Supports cleanup of expired OTP challenges.
CREATE INDEX IF NOT EXISTS idx_email_otp_expires
ON email_otp_challenges (expires_at);

-- Persistent request-rate tracking.
CREATE TABLE IF NOT EXISTS email_otp_rate_limits (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  action TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT email_otp_rate_count_nonnegative
    CHECK (request_count >= 0)
);

-- Supports rate-limit lookups.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_otp_rate_unique
ON email_otp_rate_limits (email, action);
