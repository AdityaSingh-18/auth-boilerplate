import { randomUUID } from "node:crypto";

import {
  createOtpChallenge,
  createUser,
  consumeOtpChallenge,
  consumeRateLimit,
  findActiveOtpChallenge,
  findUserByEmail,
  findUserById,
  incrementOtpAttempts,
} from "./auth-db";

import { generateOtp, hashOtp, verifyOtpHash, OTP_CONFIG } from "./otp";
import { sendOtpEmail } from "./mailer";
import { createSession, getSession, deleteSession } from "./session";

export interface PublicUser {
  id: string;
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REQUEST_LIMIT = 5;
const REQUEST_WINDOW_SECONDS = 15 * 60;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export async function requestEmailOtp(
  emailInput: string,
): Promise<void> {
  const email = normalizeEmail(emailInput);

  if (!validateEmail(email)) {
    throw new Error("INVALID_EMAIL");
  }

  const allowed = await consumeRateLimit(
    email,
    "request",
    REQUEST_LIMIT,
    REQUEST_WINDOW_SECONDS,
  );

  if (!allowed) {
    throw new Error("RATE_LIMITED");
  }

  const otp = generateOtp();
  const otpHash = hashOtp(email, otp);

  await createOtpChallenge({
    email,
    otpHash,
    expiresAt: new Date(
      Date.now() + OTP_CONFIG.expirySeconds * 1000,
    ),
  });

  await sendOtpEmail(email, otp);
}

export async function verifyEmailOtp(
  emailInput: string,
  otp: string,
): Promise<PublicUser> {
  const email = normalizeEmail(emailInput);

  if (!validateEmail(email)) {
    throw new Error("INVALID_OTP");
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("INVALID_OTP");
  }

  const allowed = await consumeRateLimit(
    email,
    "verify",
    OTP_CONFIG.maxAttempts,
    OTP_CONFIG.expirySeconds,
  );

  if (!allowed) {
    throw new Error("INVALID_OTP");
  }

  const challenge = await findActiveOtpChallenge(email);

  if (!challenge) {
    throw new Error("INVALID_OTP");
  }

  const isValid = verifyOtpHash(
    email,
    otp,
    challenge.otpHash,
  );

  if (!isValid) {
    await incrementOtpAttempts(challenge.id);
    throw new Error("INVALID_OTP");
  }

  const consumed = await consumeOtpChallenge(challenge.id);

  if (!consumed) {
    throw new Error("INVALID_OTP");
  }

  let user = await findUserByEmail(email);

  if (!user) {
    user = await createUser({
      id: randomUUID(),
      email,
    });

    // Another concurrent request may have created this user.
    if (!user) {
      user = await findUserByEmail(email);
    }
  }

  if (!user) {
    throw new Error("USER_CREATION_FAILED");
  }

  await createSession(user.id);

  return {
    id: user.id,
    email: user.email,
  };
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await findUserById(session.userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export async function logoutUser(): Promise<void> {
  await deleteSession();
}
