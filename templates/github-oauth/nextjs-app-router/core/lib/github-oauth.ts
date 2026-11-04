const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";

interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export interface GitHubProfile {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: true;
}

function getGitHubConfig(): GitHubConfig {
  const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI,
  } = process.env;

  if (
    !GITHUB_CLIENT_ID ||
    !GITHUB_CLIENT_SECRET ||
    !GITHUB_REDIRECT_URI
  ) {
    throw new Error("GitHub OAuth environment variables are missing.");
  }

  return {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    redirectUri: GITHUB_REDIRECT_URI,
  };
}

export function createGitHubAuthorizationUrl(state: string): string {
  const config = getGitHubConfig();

  const url = new URL(GITHUB_AUTHORIZE_URL);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);

  return url.toString();
}

async function exchangeGitHubCode(code: string): Promise<string> {
  const config = getGitHubConfig();

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as GitHubTokenResponse;

  if (!response.ok || data.error || !data.access_token) {
    throw new Error(
      data.error_description || "GitHub token exchange failed."
    );
  }

  return data.access_token;
}

async function fetchGitHubUser(
  accessToken: string
): Promise<GitHubUserResponse> {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": "Auth-Boilerplate",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user profile.");
  }

  return (await response.json()) as GitHubUserResponse;
}

async function fetchPrimaryVerifiedEmail(
  accessToken: string
): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/user/emails`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": "Auth-Boilerplate",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub email addresses.");
  }

  const emails = (await response.json()) as GitHubEmailResponse[];

  const primaryVerifiedEmail = emails.find(
    (entry) => entry.primary && entry.verified
  );

  if (!primaryVerifiedEmail) {
    throw new Error("No primary verified GitHub email address was found.");
  }

  return primaryVerifiedEmail.email.trim().toLowerCase();
}

export async function getGitHubProfile(
  code: string
): Promise<GitHubProfile> {
  if (!code) {
    throw new Error("GitHub authorization code is missing.");
  }

  const accessToken = await exchangeGitHubCode(code);

  const [user, email] = await Promise.all([
    fetchGitHubUser(accessToken),
    fetchPrimaryVerifiedEmail(accessToken),
  ]);

  return {
    id: String(user.id),
    email,
    name: user.name?.trim() || user.login,
    image: user.avatar_url,
    emailVerified: true,
  };
}
