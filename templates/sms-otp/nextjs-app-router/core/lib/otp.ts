import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

const OTP_LENGTH = 6;

function getOtpSecret(): string {
  const secret = process.env.OTP_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "OTP_SECRET must be configured with at least 32 bytes.",
    );
  }

  return secret;
}

export function generateOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export function hashOtp(
  phone: string,
  otp: string,
): string {
  return createHmac("sha256", getOtpSecret())
    .update(`${phone.trim()}:${otp}`)
    .digest("hex");
}

export function verifyOtpHash(
  phone: string,
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
    hashOtp(phone, otp),
    "hex",
  );

  const originalHash = Buffer.from(storedHash, "hex");

  return timingSafeEqual(submittedHash, originalHash);
}

export const OTP_CONFIG = {
  length: 6,
  expirySeconds: 300,
  maxAttempts: 5,

  requestLimit: 5,
  requestWindowSeconds: 15 * 60,

  verifyLimit: 5,
  verifyWindowSeconds: 5 * 60,
} as const;
