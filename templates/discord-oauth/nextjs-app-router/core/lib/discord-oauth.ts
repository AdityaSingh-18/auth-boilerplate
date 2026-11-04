const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_API_URL = "https://discord.com/api/v10";

interface DiscordTokenResponse {
  access_token?: unknown;
}

interface DiscordUserResponse {
  id?: unknown;
  username?: unknown;
  global_name?: unknown;
  avatar?: unknown;
  email?: unknown;
  verified?: unknown;
}

export interface DiscordProfile {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: true;
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function createDiscordAuthorizationUrl(state: string): string {
  const url = new URL(DISCORD_AUTHORIZE_URL);

  url.searchParams.set("client_id", requiredEnv("DISCORD_CLIENT_ID"));
  url.searchParams.set("redirect_uri", requiredEnv("DISCORD_REDIRECT_URI"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify email");
  url.searchParams.set("state", state);

  return url.toString();
}

async function exchangeCodeForAccessToken(
  code: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: requiredEnv("DISCORD_CLIENT_ID"),
    client_secret: requiredEnv("DISCORD_CLIENT_SECRET"),
    grant_type: "authorization_code",
    code,
    redirect_uri: requiredEnv("DISCORD_REDIRECT_URI"),
  });

  const response = await fetch(DISCORD_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Discord token exchange failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as DiscordTokenResponse;

  if (
    typeof data.access_token !== "string" ||
    !data.access_token
  ) {
    throw new Error("Discord did not return an access token");
  }

  return data.access_token;
}

function getAvatarUrl(
  userId: string,
  avatar: string | null,
): string | null {
  if (!avatar) {
    return null;
  }

  const extension = avatar.startsWith("a_") ? "gif" : "png";

  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${extension}?size=256`;
}

export async function getDiscordProfile(
  code: string,
): Promise<DiscordProfile> {
  const accessToken = await exchangeCodeForAccessToken(code);

  const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "User-Agent": "Auth-Boilerplate",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Discord profile request failed: ${response.status}`,
    );
  }

  const user = (await response.json()) as DiscordUserResponse;

  if (
    typeof user.id !== "string" ||
    typeof user.username !== "string"
  ) {
    throw new Error("Discord returned an invalid user profile");
  }

  if (
    typeof user.email !== "string" ||
    !user.email.trim() ||
    user.verified !== true
  ) {
    throw new Error(
      "A verified Discord email address is required to sign in",
    );
  }

  const name =
    typeof user.global_name === "string" &&
    user.global_name.trim()
      ? user.global_name.trim()
      : user.username.trim();

  return {
    id: user.id,
    email: user.email.trim().toLowerCase(),
    name,
    image: getAvatarUrl(
      user.id,
      typeof user.avatar === "string" ? user.avatar : null,
    ),
    emailVerified: true,
  };
}