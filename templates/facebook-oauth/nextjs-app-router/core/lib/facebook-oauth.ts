import { createHmac, timingSafeEqual } from "node:crypto";

const FACEBOOK_GRAPH_API_VERSION =
  process.env.FACEBOOK_GRAPH_API_VERSION || "v26.0";

const FACEBOOK_GRAPH_API_URL =
  `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}`;

interface FacebookTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

interface FacebookDebugTokenResponse {
  data?: {
    app_id?: string;
    type?: string;
    application?: string;
    expires_at?: number;
    is_valid?: boolean;
    user_id?: string;
  };
}

interface FacebookProfileResponse {
  id?: string;
  name?: string;
  email?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

export interface FacebookProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: false;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getAppAccessToken(): string {
  const appId = getRequiredEnv("FACEBOOK_APP_ID");
  const appSecret = getRequiredEnv("FACEBOOK_APP_SECRET");

  return `${appId}|${appSecret}`;
}

function createAppSecretProof(accessToken: string): string {
  const appSecret = getRequiredEnv("FACEBOOK_APP_SECRET");

  return createHmac("sha256", appSecret)
    .update(accessToken)
    .digest("hex");
}

function isEqualString(a: string, b: string): boolean {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  if (first.length !== second.length) {
    return false;
  }

  return timingSafeEqual(first, second);
}

export async function exchangeFacebookCode(
  code: string,
): Promise<string> {
  const appId = getRequiredEnv("FACEBOOK_APP_ID");
  const appSecret = getRequiredEnv("FACEBOOK_APP_SECRET");
  const redirectUri = getRequiredEnv("FACEBOOK_REDIRECT_URI");

  const url = new URL(`${FACEBOOK_GRAPH_API_URL}/oauth/access_token`);

  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = (await response.json()) as FacebookTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error?.message || "Failed to exchange Facebook authorization code.",
    );
  }

  return data.access_token;
}

export async function verifyFacebookAccessToken(
  accessToken: string,
): Promise<void> {
  const appId = getRequiredEnv("FACEBOOK_APP_ID");
  const appAccessToken = getAppAccessToken();

  const url = new URL(`${FACEBOOK_GRAPH_API_URL}/debug_token`);

  url.searchParams.set("input_token", accessToken);
  url.searchParams.set("access_token", appAccessToken);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const result =
    (await response.json()) as FacebookDebugTokenResponse;

  const token = result.data;

  if (!response.ok || !token?.is_valid || !token.user_id) {
    throw new Error("Facebook access token is invalid.");
  }

  if (!token.app_id || !isEqualString(token.app_id, appId)) {
    throw new Error("Facebook access token belongs to another application.");
  }

  if (token.expires_at && token.expires_at * 1000 <= Date.now()) {
    throw new Error("Facebook access token has expired.");
  }
}

export async function getFacebookProfile(
  accessToken: string,
): Promise<FacebookProfile> {
  await verifyFacebookAccessToken(accessToken);

  const url = new URL(`${FACEBOOK_GRAPH_API_URL}/me`);

  url.searchParams.set(
    "fields",
    "id,name,email,picture.type(large)",
  );
  url.searchParams.set(
    "appsecret_proof",
    createAppSecretProof(accessToken),
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const profile = (await response.json()) as FacebookProfileResponse;

  if (!response.ok || !profile.id) {
    throw new Error(
      profile.error?.message || "Failed to retrieve Facebook profile.",
    );
  }

  const email =
    typeof profile.email === "string" && profile.email.trim()
      ? profile.email.trim().toLowerCase()
      : null;

  return {
    id: profile.id,
    name:
      typeof profile.name === "string" && profile.name.trim()
        ? profile.name.trim()
        : null,
    email,
    image:
      typeof profile.picture?.data?.url === "string"
        ? profile.picture.data.url
        : null,
    emailVerified: false,
  };
}
