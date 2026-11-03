import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

// Returns the OTP hashing secret.
function getOtpSecret(): string {
  const secret = process.env.OTP_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "OTP_SECRET must be configured with at least 32 bytes.",
    );
  }

  return secret;
}

// Generates a cryptographically secure six-digit OTP.
export function generateOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

// Creates an HMAC-SHA256 hash of an OTP.
export function hashOtp(
  email: string,
  otp: string,
): string {
  return createHmac("sha256", getOtpSecret())
    .update(`${email.trim().toLowerCase()}:${otp}`)
    .digest("hex");
}

// Compares two OTP hashes without timing-based comparison.
export function verifyOtpHash(
  email: string,
  otp: string,
  storedHash: string,
): boolean {
  if (!/^\d{6}$/.test(otp)) {
    return false;
  }

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const submittedHash = Buffer.from(
    hashOtp(email, otp),
    "hex",
  );

  const originalHash = Buffer.from(storedHash, "hex");

  return timingSafeEqual(submittedHash, originalHash);
}

export const OTP_CONFIG = {
  length: OTP_LENGTH,
  expirySeconds: OTP_EXPIRY_SECONDS,
  resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  maxAttempts: MAX_OTP_ATTEMPTS,
} as const;
