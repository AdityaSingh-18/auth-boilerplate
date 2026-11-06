import "server-only";

import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export type OidcAuthorizationState = {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
};

function randomBase64Url(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

export function createOidcAuthorizationState(): OidcAuthorizationState {
  const state = randomBase64Url();
  const nonce = randomBase64Url();
  const codeVerifier = randomBase64Url(64);

  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return {
    state,
    nonce,
    codeVerifier,
    codeChallenge,
  };
}

export function verifyOidcState(
  receivedState: string,
  expectedState: string,
): boolean {
  if (!receivedState || !expectedState) {
    return false;
  }

  const received = Buffer.from(receivedState);
  const expected = Buffer.from(expectedState);

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}
