import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const OAUTH_STATE_COOKIE = "google_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "google_pkce_verifier";

export const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export function generateOAuthState(): string {
  return randomBytes(32).toString("hex");
}

export function generateCodeVerifier(): string {
  // 32 random bytes produce a 43-character base64url verifier.
  return randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(
  verifier: string,
): string {
  return createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

export function verifyOAuthState(
  receivedState: string,
  storedState: string,
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
