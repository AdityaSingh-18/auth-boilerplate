import "server-only";

import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";

import { discoverOidcConfiguration } from "./oidc-discovery";

export type VerifiedOidcProfile = {
  issuer: string;
  subject: string;
  email: string;
  emailVerified: true;
  name: string | null;
  imageUrl: string | null;
};

type TokenResponse = {
  access_token?: unknown;
  token_type?: unknown;
  expires_in?: unknown;
  id_token?: unknown;
  error?: unknown;
  error_description?: unknown;
};

type OidcIdTokenPayload = JWTPayload & {
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  azp?: string;
};

const jwksCache = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

function getClientCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env.OIDC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("OIDC client credentials are not configured");
  }

  return { clientId, clientSecret };
}

function getJwks(issuer: string, jwksUri: string) {
  const cacheKey = `${issuer}|${jwksUri}`;
  const cached = jwksCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const remoteJwks = createRemoteJWKSet(new URL(jwksUri));
  jwksCache.set(cacheKey, remoteJwks);

  return remoteJwks;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`OIDC token is missing a valid ${field} claim`);
  }

  return value.trim();
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function validateTokenResponse(value: unknown): TokenResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("OIDC provider returned an invalid token response");
  }

  const response = value as TokenResponse;

  if (typeof response.id_token !== "string" || !response.id_token) {
    throw new Error("OIDC provider did not return an ID token");
  }

  return response;
}

export async function exchangeOidcCode(input: {
  code: string;
  codeVerifier: string;
  expectedNonce: string;
  expectedIssuer: string;
}): Promise<VerifiedOidcProfile> {
  const {
    code,
    codeVerifier,
    expectedNonce,
    expectedIssuer,
  } = input;

  if (!code || !codeVerifier || !expectedNonce) {
    throw new Error("OIDC callback is missing required authorization data");
  }

  const redirectUri = process.env.OIDC_REDIRECT_URI;

  if (!redirectUri) {
    throw new Error("OIDC_REDIRECT_URI is not configured");
  }

  const { clientId, clientSecret } = getClientCredentials();
  const discovery = await discoverOidcConfiguration(expectedIssuer);

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf8",
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!tokenResponse.ok) {
    throw new Error("OIDC authorization code exchange failed");
  }

  const tokenBody: unknown = await tokenResponse.json();
  const tokens = validateTokenResponse(tokenBody);
  const idToken = tokens.id_token as string;

  const remoteJwks = getJwks(
    discovery.issuer,
    discovery.jwks_uri,
  );

  const { payload } = await jwtVerify<OidcIdTokenPayload>(
    idToken,
    remoteJwks,
    {
      algorithms: ["RS256"],
      issuer: discovery.issuer,
      audience: clientId,
      clockTolerance: 60,
      maxTokenAge: "10m",
    },
  );

  if (Array.isArray(payload.aud) && payload.aud.length > 1) {
    if (payload.azp !== clientId) {
      throw new Error("OIDC ID token authorized party is invalid");
    }
  }

  if (
    typeof payload.iat !== "number" ||
    payload.iat > Math.floor(Date.now() / 1000) + 60
  ) {
    throw new Error("OIDC ID token issued-at claim is invalid");
  }

  if (
    typeof payload.nonce !== "string" ||
    payload.nonce !== expectedNonce
  ) {
    throw new Error("OIDC ID token nonce validation failed");
  }

  const subject = requireString(payload.sub, "sub");
  const email = requireString(payload.email, "email").toLowerCase();

  if (payload.email_verified !== true) {
    throw new Error("OIDC provider has not verified the user's email");
  }

  return {
    issuer: discovery.issuer,
    subject,
    email,
    emailVerified: true,
    name: optionalString(payload.name),
    imageUrl: optionalString(payload.picture),
  };
}
