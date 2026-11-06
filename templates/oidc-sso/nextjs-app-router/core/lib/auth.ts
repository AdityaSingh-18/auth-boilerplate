import "server-only";

import {
  findEnabledTenantByDomain,
  findEnabledTenantById,
  getEmailDomain,
  getOrCreateOidcUser,
  type AuthUser,
  type OidcTenant,
} from "./auth-db";

import { exchangeOidcCode } from "./oidc";
import { createSession, getSession } from "./session";
import { discoverOidcConfiguration } from "./oidc-discovery";

export type OidcSignInStart = {
  tenant: OidcTenant;
  authorizationUrl: string;
};

export async function startOidcSignIn(
  email: string,
  state: string,
  nonce: string,
  codeChallenge: string,
): Promise<OidcSignInStart> {
  const normalizedEmail = email.trim().toLowerCase();
  const domain = getEmailDomain(normalizedEmail);

  const tenant = await findEnabledTenantByDomain(domain);

  if (!tenant) {
    throw new Error("No enabled SSO provider is configured for this email domain");
  }

  const discovery = await discoverOidcConfiguration(tenant.issuer);
  const clientId = process.env.OIDC_CLIENT_ID;
  const redirectUri = process.env.OIDC_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("OIDC client configuration is incomplete");
  }

  const authorizationUrl = new URL(discovery.authorization_endpoint);

  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("scope", "openid profile email");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  return {
    tenant,
    authorizationUrl: authorizationUrl.toString(),
  };
}

export async function completeOidcSignIn(input: {
  code: string;
  codeVerifier: string;
  nonce: string;
  tenantId: string;
}): Promise<AuthUser> {
  const tenant = await findEnabledTenantById(input.tenantId);

  if (!tenant) {
    throw new Error("The configured OIDC tenant is unavailable");
  }

  const profile = await exchangeOidcCode({
    code: input.code,
    codeVerifier: input.codeVerifier,
    expectedNonce: input.nonce,
    expectedIssuer: tenant.issuer,
  });

  // The authenticated identity must belong to the domain that was
  // selected before the user was redirected to the identity provider.
  if (getEmailDomain(profile.email) !== tenant.domain) {
    throw new Error("Authenticated email does not match the selected tenant");
  }

  const user = await getOrCreateOidcUser({
    issuer: profile.issuer,
    subject: profile.subject,
    email: profile.email,
    emailVerified: profile.emailVerified,
    name: profile.name,
    imageUrl: profile.imageUrl,
  });

  await createSession(user.id);

  return user;
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}
