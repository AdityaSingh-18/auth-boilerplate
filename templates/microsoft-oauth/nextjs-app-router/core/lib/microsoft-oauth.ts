import {
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify,
} from "jose";

const MICROSOFT_AUTHORITY =
  "https://login.microsoftonline.com/common";

const MICROSOFT_AUTHORIZE_URL =
  `${MICROSOFT_AUTHORITY}/oauth2/v2.0/authorize`;

const MICROSOFT_TOKEN_URL =
  `${MICROSOFT_AUTHORITY}/oauth2/v2.0/token`;

const MICROSOFT_JWKS_URL = new URL(
  "https://login.microsoftonline.com/common/discovery/v2.0/keys"
);

const MICROSOFT_GRAPH_ME_URL =
  "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName";

const MICROSOFT_SCOPES = [
  "openid",
  "profile",
  "email",
  "User.Read",
];

const MICROSOFT_JWKS = createRemoteJWKSet(MICROSOFT_JWKS_URL);

export interface MicrosoftProfile {
  id: string;
  tenantId: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: false;
}

interface MicrosoftTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

interface MicrosoftGraphUser {
  id: string;
  displayName?: string | null;
  mail?: string | null;
  userPrincipalName?: string | null;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function isValidMicrosoftId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export function createMicrosoftAuthorizationUrl(
  state: string,
  nonce: string,
  codeChallenge: string
): string {
  const clientId = getRequiredEnv("MICROSOFT_CLIENT_ID");
  const redirectUri = getRequiredEnv("MICROSOFT_REDIRECT_URI");

  const url = new URL(MICROSOFT_AUTHORIZE_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", MICROSOFT_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return url.toString();
}

async function exchangeMicrosoftCode(
  code: string,
  codeVerifier: string
): Promise<MicrosoftTokenResponse> {
  const clientId = getRequiredEnv("MICROSOFT_CLIENT_ID");
  const clientSecret = getRequiredEnv("MICROSOFT_CLIENT_SECRET");
  const redirectUri = getRequiredEnv("MICROSOFT_REDIRECT_URI");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    scope: MICROSOFT_SCOPES.join(" "),
  });

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Microsoft token exchange failed.");
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("access_token" in data) ||
    typeof data.access_token !== "string" ||
    !("id_token" in data) ||
    typeof data.id_token !== "string" ||
    !("token_type" in data) ||
    typeof data.token_type !== "string" ||
    !("expires_in" in data) ||
    typeof data.expires_in !== "number"
  ) {
    throw new Error("Invalid Microsoft token response.");
  }

  return data as MicrosoftTokenResponse;
}

async function verifyMicrosoftIdToken(
  idToken: string,
  expectedNonce: string
): Promise<{ id: string; tenantId: string }> {
  let untrustedPayload: ReturnType<typeof decodeJwt>;

  try {
    untrustedPayload = decodeJwt(idToken);
  } catch {
    throw new Error("Invalid Microsoft ID token.");
  }

  const tenantId = untrustedPayload.tid;
  const objectId = untrustedPayload.oid;

  if (!isValidMicrosoftId(tenantId) || !isValidMicrosoftId(objectId)) {
    throw new Error("Invalid Microsoft identity claims.");
  }

  const issuer =
    `https://login.microsoftonline.com/${tenantId}/v2.0`;

  const { payload } = await jwtVerify(
    idToken,
    MICROSOFT_JWKS,
    {
      algorithms: ["RS256"],
      issuer,
      audience: getRequiredEnv("MICROSOFT_CLIENT_ID"),
    }
  );

  if (
    payload.nonce !== expectedNonce ||
    payload.tid !== tenantId ||
    payload.oid !== objectId
  ) {
    throw new Error("Microsoft ID token validation failed.");
  }

  return {
    id: objectId,
    tenantId,
  };
}

async function getMicrosoftGraphUser(
  accessToken: string
): Promise<MicrosoftGraphUser> {
  const response = await fetch(MICROSOFT_GRAPH_ME_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve Microsoft Graph profile.");
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("id" in data) ||
    typeof data.id !== "string"
  ) {
    throw new Error("Invalid Microsoft Graph profile.");
  }

  return data as MicrosoftGraphUser;
}

export async function getMicrosoftProfile(
  code: string,
  codeVerifier: string,
  expectedNonce: string
): Promise<MicrosoftProfile> {
  const tokens = await exchangeMicrosoftCode(code, codeVerifier);

  if (tokens.token_type.toLowerCase() !== "bearer") {
    throw new Error("Unsupported Microsoft token type.");
  }

  const identity = await verifyMicrosoftIdToken(
    tokens.id_token,
    expectedNonce
  );

  const graphUser = await getMicrosoftGraphUser(
    tokens.access_token
  );

  if (graphUser.id !== identity.id) {
    throw new Error("Microsoft profile identity mismatch.");
  }

  const emailCandidate =
    graphUser.mail?.trim() ||
    graphUser.userPrincipalName?.trim() ||
    null;

  return {
    id: identity.id,
    tenantId: identity.tenantId,
    email: emailCandidate
      ? emailCandidate.toLowerCase()
      : null,
    name: graphUser.displayName?.trim() || null,
    image: null,
    emailVerified: false,
  };
}
