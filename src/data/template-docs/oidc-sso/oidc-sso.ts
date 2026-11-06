import type { TemplateDocumentation } from "@/types/auth";

export const oidcSsoDocumentation: TemplateDocumentation = {
  overview:
    "Organization-based OpenID Connect Single Sign-On for Next.js App Router. The implementation discovers configured OIDC providers dynamically, selects a tenant using the user's email domain, validates the provider's ID token, stores the external identity in Neon PostgreSQL, and creates an application-owned JWT session.",

  files: [
    {
      path: "core/db/schema.sql",
      description:
        "Creates the users, oidc_tenants, and oidc_accounts tables. Tenant records map verified email domains to administrator-configured OIDC issuers. OIDC identities are uniquely identified by issuer and subject.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Coordinates OIDC sign-in. Resolves the tenant from the supplied email domain, builds the provider authorization URL, completes the callback authentication flow, checks the authenticated email domain, and creates the application session.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Provides Neon database access, email-domain normalization, enabled tenant lookup, OIDC identity lookup, user creation, and user lookup by ID. It does not automatically link accounts by matching email addresses.",
      required: true,
    },
    {
      path: "core/lib/oidc-discovery.ts",
      description:
        "Retrieves and caches the OpenID Connect discovery document for a configured issuer. Validates the issuer and HTTPS provider endpoints, and checks support for RS256 and relevant authorization capabilities.",
      required: true,
    },
    {
      path: "core/lib/oidc-state.ts",
      description:
        "Generates cryptographically random state, nonce, and PKCE verifier values. Creates the S256 PKCE challenge and provides timing-safe state comparison.",
      required: true,
    },
    {
      path: "core/lib/oidc.ts",
      description:
        "Exchanges the authorization code at the discovered token endpoint and verifies the returned ID token using the provider's remote JWKS. Validates issuer, audience, signature, expiration, nonce, issued-at time, and verified email.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates, verifies, and deletes the application's own HS256 JWT session cookie. The session is separate from the identity provider's ID token.",
      required: true,
    },
    {
      path: "core/api/auth/oidc/start/route.ts",
      description:
        "Accepts a work email address, resolves its configured tenant, generates OIDC authorization parameters, stores temporary flow values in HTTP-only cookies, and returns the provider authorization URL.",
      required: true,
    },
    {
      path: "core/api/auth/oidc/callback/route.ts",
      description:
        "Handles the provider's authorization callback. Validates state and flow cookies, completes authentication, clears temporary cookies, and redirects to the application login page.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description:
        "Clears the application session cookie and returns a logout response.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Verifies the application session and retrieves the corresponding user record from the database.",
      required: true,
    },
    {
      path: "optional-ui/OidcSignIn.tsx",
      description:
        "Optional client-side sign-in component. Accepts a work email, starts the OIDC flow, redirects to the identity provider, displays the current user, and supports logout.",
      required: false,
    },
    {
      path: ".env.example",
      description:
        "Documents the Neon connection string, application session secret, shared OIDC client credentials, callback URL, and public application URL.",
      required: true,
    },
    {
      path: "README.md",
      description:
        "Explains installation, OIDC provider configuration, tenant registration, database setup, Next.js integration, API endpoints, authentication flow, security considerations, limitations, and production checklist.",
      required: true,
    },
  ],

  functions: [
    {
      name: "startOidcSignIn",
      description:
        "Resolves an enabled OIDC tenant from the supplied email domain, retrieves its discovery configuration, and constructs the authorization URL with state, nonce, and PKCE S256 parameters.",
      signature:
        "startOidcSignIn(email: string, state: string, nonce: string, codeChallenge: string): Promise<OidcSignInStart>",
    },
    {
      name: "completeOidcSignIn",
      description:
        "Reloads the enabled tenant, exchanges the authorization code, validates the ID token, verifies that the authenticated email domain matches the selected tenant, resolves the OIDC identity, and creates an application session.",
      signature:
        "completeOidcSignIn(input: { code: string; codeVerifier: string; nonce: string; tenantId: string }): Promise<AuthUser>",
    },
    {
      name: "discoverOidcConfiguration",
      description:
        "Retrieves and caches the discovery document for an administrator-configured HTTPS issuer. Checks the returned issuer and required provider endpoints.",
      signature:
        "discoverOidcConfiguration(configuredIssuer: string): Promise<OidcDiscoveryDocument>",
    },
    {
      name: "createOidcAuthorizationState",
      description:
        "Generates cryptographically random OAuth state, nonce, and PKCE verifier values, along with the corresponding S256 code challenge.",
      signature:
        "createOidcAuthorizationState(): OidcAuthorizationState",
    },
    {
      name: "verifyOidcState",
      description:
        "Compares the callback state with the expected state using a timing-safe comparison.",
      signature:
        "verifyOidcState(receivedState: string, expectedState: string): boolean",
    },
    {
      name: "exchangeOidcCode",
      description:
        "Exchanges an authorization code using the configured client credentials and PKCE verifier. Verifies the provider's ID token using its discovered JWKS and returns a verified identity profile.",
      signature:
        "exchangeOidcCode(input: { code: string; codeVerifier: string; expectedNonce: string; expectedIssuer: string }): Promise<VerifiedOidcProfile>",
    },
    {
      name: "findEnabledTenantByDomain",
      description:
        "Finds an enabled tenant using a normalized email domain.",
      signature:
        "findEnabledTenantByDomain(domain: string): Promise<OidcTenant | null>",
    },
    {
      name: "getOrCreateOidcUser",
      description:
        "Resolves an application user using the exact OIDC issuer and subject pair. Creates a user and identity record when the identity does not exist. It requires a verified email and does not automatically link accounts by email.",
      signature:
        "getOrCreateOidcUser(profile: OidcUserProfile): Promise<AuthUser>",
    },
    {
      name: "createSession",
      description:
        "Signs an application-owned HS256 JWT and stores it in the HTTP-only auth_session cookie.",
      signature:
        "createSession(userId: string): Promise<void>",
    },
    {
      name: "getSession",
      description:
        "Verifies the application session JWT and returns the authenticated user ID, or null when the session is missing or invalid.",
      signature:
        "getSession(): Promise<AuthSession | null>",
    },
    {
      name: "deleteSession",
      description:
        "Expires the application session cookie in the browser.",
      signature:
        "deleteSession(): Promise<void>",
    },
  ],

  environmentVariables: [
    {
      name: "DATABASE_URL",
      description:
        "Neon PostgreSQL connection string used for tenant, user, and OIDC identity persistence.",
      required: true,
      example:
        "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require",
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign and verify application session JWTs. Must contain at least 32 bytes.",
      required: true,
      example: "replace-with-a-random-secret-at-least-32-bytes-long",
    },
    {
      name: "OIDC_CLIENT_ID",
      description:
        "Client ID for the shared OIDC application registration used by configured tenants.",
      required: true,
      example: "your-oidc-client-id",
    },
    {
      name: "OIDC_CLIENT_SECRET",
      description:
        "Client secret for the shared OIDC application registration. Keep it server-side.",
      required: true,
      example: "your-oidc-client-secret",
    },
    {
      name: "OIDC_REDIRECT_URI",
      description:
        "Callback URL registered with the OIDC identity provider. Must exactly match the registered redirect URI.",
      required: true,
      example: "http://localhost:3000/api/auth/oidc/callback",
    },
    {
      name: "APP_URL",
      description:
        "Public base URL of the application. Used to construct callback redirects.",
      required: true,
      example: "http://localhost:3000",
    },
  ],

  securityNotes: [
    {
      title: "Administrator-configured issuers",
      description:
        "Only issuer URLs stored in the administrator-managed oidc_tenants table are used. Users cannot supply arbitrary issuer URLs. Production deployments should also restrict outbound network access to approved identity-provider destinations.",
    },
    {
      title: "OIDC discovery validation",
      description:
        "The discovery document issuer must exactly match the configured issuer. The implementation requires HTTPS provider endpoints and RS256 ID token signing support.",
    },
    {
      title: "State and nonce validation",
      description:
        "Random state and nonce values are stored in temporary HTTP-only cookies. The callback compares state using a timing-safe comparison and verifies the nonce claim in the ID token.",
    },
    {
      title: "PKCE protection",
      description:
        "The authorization code flow uses PKCE with the S256 challenge method. The code verifier is stored in an HTTP-only temporary cookie.",
    },
    {
      title: "ID token validation",
      description:
        "The provider's ID token signature is verified using its discovered JWKS. Issuer, audience, expiration, issued-at time, nonce, and email verification are checked.",
    },
    {
      title: "Tenant email-domain validation",
      description:
        "The authenticated email must be verified and its normalized domain must match the tenant selected before the provider redirect.",
    },
    {
      title: "OIDC account identity",
      description:
        "External identities are keyed by the exact issuer and subject pair. The implementation does not automatically link accounts solely because their email addresses match.",
    },
    {
      title: "Application session",
      description:
        "The application creates its own HS256 JWT session in an HTTP-only cookie. The cookie uses SameSite=Lax and Secure in production. Clearing the cookie does not revoke a copied JWT before its expiration.",
    },
    {
      title: "Shared client credentials",
      description:
        "This implementation uses one shared OIDC client ID and secret for configured tenants. Each provider must support that registration. Providers requiring separate credentials need a tenant-specific credential-management design.",
    },
    {
      title: "Production hardening",
      description:
        "The reference implementation does not include IP-based rate limiting, server-side session revocation, tenant administration authorization, provider logout, or group and role synchronization. Add and test these controls before production use.",
    },
  ],
};
