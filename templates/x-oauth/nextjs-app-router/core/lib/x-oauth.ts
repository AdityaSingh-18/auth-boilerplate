import { Buffer } from "node:buffer";

const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_USER_URL = "https://api.x.com/2/users/me";

export interface XProfile {
  id: string;
  username: string;
  name: string;
  image: string | null;
  email: null;
  emailVerified: false;
}

interface XTokenResponse {
  token_type: string;
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

interface XUserResponse {
  data: {
    id: string;
    username: string;
    name: string;
    profile_image_url?: string;
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseTokenResponse(value: unknown): XTokenResponse {
  if (!isRecord(value)) {
    throw new Error("Invalid X token response.");
  }

  if (
    typeof value.access_token !== "string" ||
    typeof value.token_type !== "string"
  ) {
    throw new Error("X did not return a valid access token.");
  }

  return {
    access_token: value.access_token,
    token_type: value.token_type,
    expires_in:
      typeof value.expires_in === "number"
        ? value.expires_in
        : undefined,
    refresh_token:
      typeof value.refresh_token === "string"
        ? value.refresh_token
        : undefined,
    scope: typeof value.scope === "string" ? value.scope : undefined,
  };
}

function parseUserResponse(value: unknown): XUserResponse {
  if (!isRecord(value) || !isRecord(value.data)) {
    throw new Error("Invalid X user response.");
  }

  const user = value.data;

  if (
    typeof user.id !== "string" ||
    typeof user.username !== "string" ||
    typeof user.name !== "string"
  ) {
    throw new Error("X returned an incomplete user profile.");
  }

  return {
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      profile_image_url:
        typeof user.profile_image_url === "string"
          ? user.profile_image_url
          : undefined,
    },
  };
}

export function buildXAuthorizationUrl(
  state: string,
  codeChallenge: string
): string {
  const clientId = getRequiredEnv("X_CLIENT_ID");
  const redirectUri = getRequiredEnv("X_REDIRECT_URI");

  const url = new URL(X_AUTHORIZE_URL);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "users.read");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return url.toString();
}

export async function exchangeXCode(
  code: string,
  codeVerifier: string
): Promise<XTokenResponse> {
  const clientId = getRequiredEnv("X_CLIENT_ID");
  const clientSecret = getRequiredEnv("X_CLIENT_SECRET");
  const redirectUri = getRequiredEnv("X_REDIRECT_URI");

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  const result: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `X token exchange failed with status ${response.status}.`
    );
  }

  return parseTokenResponse(result);
}

export async function getXProfile(
  accessToken: string
): Promise<XProfile> {
  const url = new URL(X_USER_URL);
  url.searchParams.set(
    "user.fields",
    "id,name,username,profile_image_url"
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const result: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `X user lookup failed with status ${response.status}.`
    );
  }

  const user = parseUserResponse(result).data;

  return {
    id: user.id,
    username: user.username,
    name: user.name.trim() || user.username,
    image: user.profile_image_url ?? null,
    email: null,
    emailVerified: false,
  };
}
