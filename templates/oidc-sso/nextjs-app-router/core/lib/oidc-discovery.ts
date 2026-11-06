import "server-only";

export type OidcDiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported?: string[];
  subject_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  code_challenge_methods_supported?: string[];
};

type CachedDiscovery = {
  document: OidcDiscoveryDocument;
  expiresAt: number;
};

const DISCOVERY_CACHE_TTL_MS = 5 * 60 * 1000;
const DISCOVERY_TIMEOUT_MS = 10_000;

const discoveryCache = new Map<string, CachedDiscovery>();

function parseHttpsUrl(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid OIDC discovery field: ${fieldName}`);
  }

  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error(`OIDC discovery field must be a valid HTTPS URL: ${fieldName}`);
  }

  return url.toString();
}

function parseDiscoveryDocument(
  value: unknown,
  expectedIssuer: string,
): OidcDiscoveryDocument {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid OIDC discovery response");
  }

  const document = value as Record<string, unknown>;

  if (document.issuer !== expectedIssuer) {
    throw new Error("OIDC discovery issuer does not match the configured issuer");
  }

  const responseTypes = document.response_types_supported;
  const signingAlgorithms = document.id_token_signing_alg_values_supported;
  const authMethods = document.token_endpoint_auth_methods_supported;
  const challengeMethods = document.code_challenge_methods_supported;

  if (
    Array.isArray(responseTypes) &&
    !responseTypes.includes("code")
  ) {
    throw new Error("OIDC provider does not support authorization code flow");
  }

  if (
    !Array.isArray(signingAlgorithms) ||
    !signingAlgorithms.includes("RS256")
  ) {
    throw new Error("OIDC provider must support RS256 ID token signatures");
  }

  if (
    Array.isArray(authMethods) &&
    !authMethods.includes("client_secret_basic")
  ) {
    throw new Error("OIDC provider must support client_secret_basic authentication");
  }

  if (
    Array.isArray(challengeMethods) &&
    !challengeMethods.includes("S256")
  ) {
    throw new Error("OIDC provider must support PKCE S256");
  }

  return {
    issuer: expectedIssuer,
    authorization_endpoint: parseHttpsUrl(
      document.authorization_endpoint,
      "authorization_endpoint",
    ),
    token_endpoint: parseHttpsUrl(
      document.token_endpoint,
      "token_endpoint",
    ),
    jwks_uri: parseHttpsUrl(document.jwks_uri, "jwks_uri"),
    response_types_supported: Array.isArray(responseTypes)
      ? responseTypes.filter((item): item is string => typeof item === "string")
      : undefined,
    subject_types_supported: Array.isArray(document.subject_types_supported)
      ? document.subject_types_supported.filter(
          (item): item is string => typeof item === "string",
        )
      : undefined,
    id_token_signing_alg_values_supported: signingAlgorithms.filter(
      (item): item is string => typeof item === "string",
    ),
    token_endpoint_auth_methods_supported: Array.isArray(authMethods)
      ? authMethods.filter((item): item is string => typeof item === "string")
      : undefined,
    code_challenge_methods_supported: Array.isArray(challengeMethods)
      ? challengeMethods.filter(
          (item): item is string => typeof item === "string",
        )
      : undefined,
  };
}

export function validateConfiguredIssuer(issuer: string): string {
  const trimmedIssuer = issuer.trim();

  if (!trimmedIssuer || trimmedIssuer !== issuer) {
    throw new Error("Invalid configured OIDC issuer");
  }

  const url = new URL(trimmedIssuer);

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Configured OIDC issuer must be a clean HTTPS URL");
  }

  return trimmedIssuer;
}

export async function discoverOidcConfiguration(
  configuredIssuer: string,
): Promise<OidcDiscoveryDocument> {
  const issuer = validateConfiguredIssuer(configuredIssuer);
  const cached = discoveryCache.get(issuer);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.document;
  }

  const discoveryUrl = `${issuer.replace(/\/+$/, "")}/.well-known/openid-configuration`;

  const response = await fetch(discoveryUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(DISCOVERY_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve OIDC discovery configuration");
  }

  const responseBody: unknown = await response.json();
  const document = parseDiscoveryDocument(responseBody, issuer);

  discoveryCache.set(issuer, {
    document,
    expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS,
  });

  return document;
}
