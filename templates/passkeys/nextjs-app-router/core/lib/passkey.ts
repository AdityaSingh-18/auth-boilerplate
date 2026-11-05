import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";

import { isoBase64URL } from "@simplewebauthn/server/helpers";

import {
  consumeChallenge,
  findActiveChallenge,
  getPasskeyByCredentialId,
  getUserPasskeys,
  storePasskey,
  updatePasskeyCounter,
} from "./auth-db";

import { saveChallenge } from "./passkey-challenge";

function env(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export const rpName = () => env("RP_NAME");

export const rpID = () => env("RP_ID");

export function rpOrigin(): string {
  const configured = env("RP_ORIGIN");
  const parsed = new URL(configured);
  const relyingPartyId = rpID();

  if (parsed.origin !== configured) {
    throw new Error("RP_ORIGIN must be an origin without a path.");
  }

  if (
    parsed.protocol !== "https:" &&
    parsed.hostname !== "localhost"
  ) {
    throw new Error("RP_ORIGIN must use HTTPS outside localhost.");
  }

  if (
    parsed.hostname !== relyingPartyId &&
    !parsed.hostname.endsWith(`.${relyingPartyId}`)
  ) {
    throw new Error(
      "RP_ID must match RP_ORIGIN or be its parent domain.",
    );
  }

  return parsed.origin;
}

/**
 * Extracts the challenge from the browser response.
 *
 * This value is untrusted until the corresponding
 * SimpleWebAuthn verification function succeeds.
 */
function getClientChallenge(clientDataJSON: string): string {
  let data: { challenge?: unknown };

  try {
    data = JSON.parse(
      Buffer.from(clientDataJSON, "base64url").toString("utf8"),
    ) as { challenge?: unknown };
  } catch {
    throw new Error("Invalid WebAuthn client data.");
  }

  if (typeof data.challenge !== "string" || !data.challenge) {
    throw new Error("WebAuthn response is missing its challenge.");
  }

  return data.challenge;
}

export async function createRegistrationOptions(user: {
  id: string;
  email: string | null;
  name: string | null;
}) {
  const credentials = await getUserPasskeys(user.id);

  const options = await generateRegistrationOptions({
    rpName: rpName(),
    rpID: rpID(),
    userID: Buffer.from(user.id),
    userName: user.email ?? user.id,
    userDisplayName: user.name ?? user.email ?? "User",
    attestationType: "none",
    excludeCredentials: credentials.map((credential) => ({
      id: credential.credential_id,
      transports: credential.transports as (
        | "ble"
        | "hybrid"
        | "internal"
        | "nfc"
        | "usb"
      )[],
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
    timeout: 60_000,
  });

  await saveChallenge(options.challenge, "registration", user.id);

  return options;
}

export async function verifyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
) {
  const challenge = getClientChallenge(
    response.response.clientDataJSON,
  );

  const active = await findActiveChallenge(
    challenge,
    "registration",
  );

  if (!active || active.user_id !== userId) {
    throw new Error(
      "Registration challenge is invalid, expired, or already used.",
    );
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: rpOrigin(),
    expectedRPID: rpID(),
    requireUserVerification: false,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Passkey registration could not be verified.");
  }

  const consumed = await consumeChallenge(
    challenge,
    "registration",
  );

  if (!consumed || consumed.user_id !== userId) {
    throw new Error("Registration challenge was already consumed.");
  }

  const info = verification.registrationInfo;

  await storePasskey({
    credentialId: info.credential.id,
    userId,
    publicKey: info.credential.publicKey,
    counter: info.credential.counter,
    transports: info.credential.transports,
    deviceType: info.credentialDeviceType,
    backedUp: info.credentialBackedUp,
  });

  return { verified: true };
}

export async function createAuthenticationOptions() {
  const options = await generateAuthenticationOptions({
    rpID: rpID(),
    userVerification: "preferred",
    timeout: 60_000,
  });

  await saveChallenge(
    options.challenge,
    "authentication",
    null,
  );

  return options;
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
) {
  const challenge = getClientChallenge(
    response.response.clientDataJSON,
  );

  const active = await findActiveChallenge(
    challenge,
    "authentication",
  );

  if (!active || active.user_id !== null) {
    throw new Error(
      "Authentication challenge is invalid, expired, or already used.",
    );
  }

  const credential = await getPasskeyByCredentialId(response.id);

  if (!credential) {
    throw new Error("Passkey not found.");
  }

  const previousCounter = Number(credential.counter);

  if (!Number.isSafeInteger(previousCounter) || previousCounter < 0) {
    throw new Error("Stored passkey counter is invalid.");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: rpOrigin(),
    expectedRPID: rpID(),
    credential: {
      id: credential.credential_id,
      publicKey: isoBase64URL.toBuffer(credential.public_key),
      counter: previousCounter,
      transports: credential.transports as (
        | "ble"
        | "hybrid"
        | "internal"
        | "nfc"
        | "usb"
      )[],
    },
    requireUserVerification: false,
  });

  if (!verification.verified) {
    throw new Error("Passkey authentication failed.");
  }

  const consumed = await consumeChallenge(
    challenge,
    "authentication",
  );

  if (!consumed || consumed.user_id !== null) {
    throw new Error("Authentication challenge was already consumed.");
  }

  const updated = await updatePasskeyCounter(
    credential.credential_id,
    previousCounter,
    verification.authenticationInfo.newCounter,
  );

  if (!updated || updated.user_id !== credential.user_id) {
    throw new Error(
      "Passkey counter changed during authentication. Please try again.",
    );
  }

  return { userId: credential.user_id };
}
