import { randomBytes, timingSafeEqual } from "node:crypto";

export const OAUTH_STATE_COOKIE = "apple_oauth_state";
export const OAUTH_NONCE_COOKIE = "apple_oauth_nonce";

export const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export function generateOAuthState(): string {
  return randomBytes(32).toString("hex");
}

export function generateOAuthNonce(): string {
  return randomBytes(32).toString("hex");
}

export function verifyOAuthValue(
  receivedValue: string,
  storedValue: string
): boolean {
  if (!receivedValue || !storedValue) {
    return false;
  }

  const received = Buffer.from(receivedValue);
  const stored = Buffer.from(storedValue);

  if (received.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(received, stored);
}

export function verifyOAuthState(
  receivedState: string,
  storedState: string
): boolean {
  return verifyOAuthValue(receivedState, storedState);
}

export function verifyOAuthNonce(
  receivedNonce: string,
  storedNonce: string
): boolean {
  return verifyOAuthValue(receivedNonce, storedNonce);
}
