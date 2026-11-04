import { randomBytes, timingSafeEqual } from "node:crypto";

export const OAUTH_STATE_COOKIE = "github_oauth_state";
export const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export function generateOAuthState(): string {
  return randomBytes(32).toString("hex");
}

export function verifyOAuthState(
  receivedState: string,
  storedState: string
): boolean {
  if (!receivedState || !storedState) {
    return false;
  }

  const received = Buffer.from(receivedState);
  const stored = Buffer.from(storedState);

  if (received.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(received, stored);
}
