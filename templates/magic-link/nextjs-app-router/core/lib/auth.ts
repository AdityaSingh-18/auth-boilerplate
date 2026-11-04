import {
  consumeMagicLinkRateLimit,
  consumeMagicLinkToken,
  createMagicLinkToken,
  createUser,
  findUserByEmail,
  findUserById,
} from "./auth-db";
import {
  generateMagicLinkToken,
  hashMagicLinkToken,
  MAGIC_LINK_CONFIG,
  verifyMagicLinkToken,
} from "./magic-link";
import { sendMagicLinkEmail, type EmailSender } from "./mailer";
import { getSession } from "./session";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAppUrl(): string {
  const value = process.env.APP_URL;

  if (!value) {
    throw new Error("APP_URL must be configured.");
  }

  return value.replace(/\/+$/, "");
}

export async function requestMagicLink(
  rawEmail: string,
  sender?: EmailSender,
): Promise<void> {
  const email = normalizeEmail(rawEmail);

  if (!isValidEmail(email)) {
    throw new Error("INVALID_EMAIL");
  }

  const allowed = await consumeMagicLinkRateLimit(
    email,
    MAGIC_LINK_CONFIG.maxRequests,
    MAGIC_LINK_CONFIG.rateLimitWindowSeconds,
  );

  if (!allowed) {
    throw new Error("RATE_LIMITED");
  }

  const token = await generateMagicLinkToken(email);
  const tokenHash = hashMagicLinkToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_CONFIG.expirySeconds * 1000);

  await createMagicLinkToken({ email, tokenHash, expiresAt });

  const url = new URL("/api/auth/callback", getAppUrl());
  url.searchParams.set("token", token);

  await sendMagicLinkEmail(email, url.toString(), sender);
}

export async function completeMagicLinkSignIn(token: string) {
  if (token.length > 4096) {
    throw new Error("Invalid magic-link token.");
  }

  const { email } = await verifyMagicLinkToken(token);
  const tokenHash = hashMagicLinkToken(token);
  const consumed = await consumeMagicLinkToken(email, tokenHash);

  if (!consumed) {
    throw new Error("Magic link has expired or has already been used.");
  }

  let user = await findUserByEmail(email);

  if (!user) {
    user = await createUser(email);
    if (!user) {
      user = await findUserByEmail(email);
    }
  }

  if (!user) {
    throw new Error("Unable to create or retrieve user.");
  }

  return user;
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) return null;

  return findUserById(session.userId);
}
