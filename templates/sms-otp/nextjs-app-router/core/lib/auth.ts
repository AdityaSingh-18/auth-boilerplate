import { randomUUID } from "node:crypto";

import {
  consumeOtpChallenge,
  consumeRateLimit,
  createOtpChallenge,
  createUser,
  findActiveOtpChallenge,
  findUserByPhone,
  incrementOtpAttempts,
  invalidateOtpChallenge,
  type AuthUser,
} from "./auth-db";

import {
  generateOtp,
  hashOtp,
  OTP_CONFIG,
  verifyOtpHash,
} from "./otp";

import {
  sendOtpSms,
  type SmsSender,
} from "./sms";

import {
  createSession,
  getSession,
} from "./session";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/[()\s.-]/g, "");
}

export function isValidPhone(phone: string): boolean {
  return E164_REGEX.test(phone);
}

// Generates and sends an OTP to the supplied phone number.
export async function requestPhoneOtp(
  rawPhone: string,
  sender?: SmsSender,
): Promise<void> {
  const phone = normalizePhone(rawPhone);

  if (!isValidPhone(phone)) {
    throw new Error("INVALID_PHONE");
  }

  const allowed = await consumeRateLimit(
    phone,
    "request",
    OTP_CONFIG.requestLimit,
    OTP_CONFIG.requestWindowSeconds,
  );

  if (!allowed) {
    throw new Error("RATE_LIMITED");
  }

  const otp = generateOtp();
  const otpHash = hashOtp(phone, otp);

  const challenge = await createOtpChallenge({
    phone,
    otpHash,
    expiresAt: new Date(
      Date.now() + OTP_CONFIG.expirySeconds * 1000,
    ),
  });

  try {
    await sendOtpSms(phone, otp, sender);
  } catch (error) {
    await invalidateOtpChallenge(challenge.id);
    throw error;
  }
}

// Verifies an OTP and establishes an authenticated session.
export async function verifyPhoneOtp(
  rawPhone: string,
  otp: string,
): Promise<AuthUser> {
  const phone = normalizePhone(rawPhone);

  if (!isValidPhone(phone) || !/^\d{6}$/.test(otp)) {
    throw new Error("INVALID_OTP");
  }

  const allowed = await consumeRateLimit(
    phone,
    "verify",
    OTP_CONFIG.verifyLimit,
    OTP_CONFIG.verifyWindowSeconds,
  );

  if (!allowed) {
    throw new Error("RATE_LIMITED");
  }

  const challenge = await findActiveOtpChallenge(phone);

  if (!challenge) {
    throw new Error("INVALID_OTP");
  }

  if (!verifyOtpHash(phone, otp, challenge.otpHash)) {
    await incrementOtpAttempts(challenge.id);
    throw new Error("INVALID_OTP");
  }

  const consumed = await consumeOtpChallenge(challenge.id);

  if (!consumed) {
    throw new Error("INVALID_OTP");
  }

  let user = await findUserByPhone(phone);

  if (!user) {
    user = await createUser({
      id: randomUUID(),
      phone,
    });

    // Handle a concurrent registration for the same phone number.
    if (!user) {
      user = await findUserByPhone(phone);
    }
  }

  if (!user) {
    throw new Error("USER_CREATION_FAILED");
  }

  await createSession(user);

  return user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return getSession();
}
