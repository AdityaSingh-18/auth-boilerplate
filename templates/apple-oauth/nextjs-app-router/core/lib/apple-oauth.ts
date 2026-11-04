import {
  createRemoteJWKSet,
  importPKCS8,
  jwtVerify,
  SignJWT,
} from "jose";

const APPLE_AUTHORIZATION_URL = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = new URL("https://appleid.apple.com/auth/keys");

const appleJWKS = createRemoteJWKSet(APPLE_JWKS_URL);

export interface AppleProfile {
  id: string;
  email: string | null;
  emailVerified: boolean;
}

interface AppleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token: string;
}

function getApplePrivateKey(): string {
  const privateKey = process.env.APPLE_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Missing APPLE_PRIVATE_KEY.");
  }

  return privateKey.replace(/\\n/g, "\n");
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

export async function generateAppleClientSecret(): Promise<string> {
  const teamId = getRequiredEnv("APPLE_TEAM_ID");
  const keyId = getRequiredEnv("APPLE_KEY_ID");
  const clientId = getRequiredEnv("APPLE_CLIENT_ID");

  const privateKey = await importPKCS8(
    getApplePrivateKey(),
    "ES256"
  );

  const now = Math.floor(Date.now() / 1000);

  // Apple permits client-secret JWTs with an expiry of up to six months.
  const expiration = now + 60 * 60 * 24 * 180;

  return new SignJWT({})
    .setProtectedHeader({
      alg: "ES256",
      kid: keyId,
    })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(expiration)
    .setAudience(APPLE_ISSUER)
    .setSubject(clientId)
    .sign(privateKey);
}

export function createAppleAuthorizationUrl(
  state: string,
  nonce: string
): string {
  const clientId = getRequiredEnv("APPLE_CLIENT_ID");
  const redirectUri = getRequiredEnv("APPLE_REDIRECT_URI");

  const url = new URL(APPLE_AUTHORIZATION_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "form_post");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);

  return url.toString();
}

async function exchangeAppleCode(
  code: string
): Promise<AppleTokenResponse> {
  const clientId = getRequiredEnv("APPLE_CLIENT_ID");
  const redirectUri = getRequiredEnv("APPLE_REDIRECT_URI");
  const clientSecret = await generateAppleClientSecret();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch(APPLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Apple authorization code exchange failed.");
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("id_token" in data) ||
    typeof data.id_token !== "string" ||
    !("access_token" in data) ||
    typeof data.access_token !== "string" ||
    !("token_type" in data) ||
    typeof data.token_type !== "string" ||
    !("expires_in" in data) ||
    typeof data.expires_in !== "number"
  ) {
    throw new Error("Invalid Apple token response.");
  }

  return data as AppleTokenResponse;
}

async function verifyAppleIdToken(
  idToken: string,
  expectedNonce: string
): Promise<AppleProfile> {
  const clientId = getRequiredEnv("APPLE_CLIENT_ID");

  const { payload } = await jwtVerify(idToken, appleJWKS, {
    issuer: APPLE_ISSUER,
    audience: clientId,
    algorithms: ["RS256"],
  });

  if (
    typeof payload.sub !== "string" ||
    payload.sub.length === 0
  ) {
    throw new Error("Invalid Apple account identifier.");
  }

  if (
    typeof payload.nonce !== "string" ||
    payload.nonce !== expectedNonce
  ) {
    throw new Error("Apple ID token nonce validation failed.");
  }

  const email =
    typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : null;

  const emailVerified =
    payload.email_verified === true ||
    payload.email_verified === "true";

  return {
    id: payload.sub,
    email: email || null,
    emailVerified,
  };
}

export async function getAppleProfile(
  code: string,
  expectedNonce: string
): Promise<AppleProfile> {
  if (!code) {
    throw new Error("Missing Apple authorization code.");
  }

  const tokens = await exchangeAppleCode(code);

  return verifyAppleIdToken(tokens.id_token, expectedNonce);
}
