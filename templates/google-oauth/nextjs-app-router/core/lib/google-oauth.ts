import { createRemoteJWKSet, jwtVerify } from "jose";
import { generateCodeChallenge } from "./oauth-state";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");

const googleJwks = createRemoteJWKSet(GOOGLE_JWKS_URL);

export interface GoogleProfile {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: string;
}

interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth environment variables are missing.");
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function createGoogleAuthorizationUrl(
  state: string,
  codeVerifier: string,
): string {
  const { clientId, redirectUri } = getGoogleConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: generateCodeChallenge(codeVerifier),
    code_challenge_method: "S256",
    access_type: "online",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
): Promise<GoogleTokenResponse> {
  const {
    clientId,
    clientSecret,
    redirectUri,
  } = getGoogleConfig();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Google authorization code exchange failed.");
  }

  const tokens = (await response.json()) as GoogleTokenResponse;

  if (!tokens.id_token) {
    throw new Error("Google did not return an ID token.");
  }

  return tokens;
}

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleProfile> {
  const { clientId } = getGoogleConfig();

  const { payload } = await jwtVerify(
    idToken,
    googleJwks,
    {
      issuer: [
        "https://accounts.google.com",
        "accounts.google.com",
      ],
      audience: clientId,
    },
  );

  const claims = payload as unknown as GoogleIdTokenPayload;

  if (
    typeof claims.sub !== "string" ||
    typeof claims.email !== "string" ||
    claims.email_verified !== true
  ) {
    throw new Error("Google ID token does not contain a verified identity.");
  }

  return {
    id: claims.sub,
    email: claims.email.trim().toLowerCase(),
    name: claims.name ?? null,
    picture: claims.picture ?? null,
    emailVerified: true,
  };
}

export async function getGoogleProfile(
  code: string,
  codeVerifier: string,
): Promise<GoogleProfile> {
  const tokens = await exchangeGoogleCode(code, codeVerifier);

  return verifyGoogleIdToken(tokens.id_token);
}
