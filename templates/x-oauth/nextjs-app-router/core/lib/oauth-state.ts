import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const X_STATE_COOKIE = "x_oauth_state";
export const X_CODE_VERIFIER_COOKIE = "x_oauth_code_verifier";

export const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export function generateRandomValue(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

export function isValidOAuthState(
  receivedState: string,
  storedState: string
): boolean {
  const received = Buffer.from(receivedState);
  const stored = Buffer.from(storedState);

  if (received.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(received, stored);
}
