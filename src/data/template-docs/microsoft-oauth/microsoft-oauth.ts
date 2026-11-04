import type { TemplateDocumentation } from "@/types/auth";

export const microsoftOAuthDocumentation: TemplateDocumentation = {
  overview:
    "Microsoft OAuth boilerplate for Next.js App Router using the Microsoft identity platform authorization code flow with PKCE. It validates OAuth state and the OpenID Connect nonce, verifies the Microsoft ID token, retrieves the user's profile through Microsoft Graph, stores the Microsoft account identity in Neon PostgreSQL, and creates a signed JWT application session.",

  files: [
    {
      path: "core/api/auth/microsoft/route.ts",
      description:
        "Starts Microsoft sign-in by generating OAuth state, an OIDC nonce, and PKCE values before redirecting the user to Microsoft.",
      required: true,
    },
    {
      path: "core/api/auth/microsoft/callback/route.ts",
      description:
        "Handles Microsoft's authorization callback, validates OAuth state, exchanges the authorization code, and establishes the application session.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description: "Deletes the local application session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Returns the currently authenticated application user.",
      required: true,
    },
    {
      path: "core/db/schema.sql",
      description:
        "Creates the users and oauth_accounts tables for application users and Microsoft account identities.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Coordinates Microsoft profile retrieval, database user creation or lookup, and application session creation.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Provides Neon database operations for finding users, creating users, and linking Microsoft accounts using tenant and object IDs.",
      required: true,
    },
    {
      path: "core/lib/microsoft-oauth.ts",
      description:
        "Builds Microsoft authorization URLs, exchanges authorization codes, verifies ID tokens, and retrieves user profiles from Microsoft Graph.",
      required: true,
    },
    {
      path: "core/lib/oauth-state.ts",
      description:
        "Generates and validates OAuth state, OIDC nonce, and PKCE verifier and challenge values.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates, verifies, and deletes signed JWT application sessions stored in HTTP-only cookies.",
      required: true,
    },
    {
      path: "optional-ui/AuthButton.tsx",
      description:
        "Optional client-side component that displays Microsoft sign-in or sign-out controls and checks the current session.",
      required: false,
    },
  ],

  functions: [
    {
      name: "signInWithMicrosoft",
      description:
        "Completes Microsoft sign-in by retrieving the Microsoft profile, finding or creating the application user, and creating an application session.",
      signature:
        "signInWithMicrosoft(code: string, codeVerifier: string, nonce: string): Promise<void>",
    },
    {
      name: "createMicrosoftAuthorizationUrl",
      description:
        "Builds the Microsoft authorization URL using OAuth state, nonce, and the PKCE code challenge.",
      signature:
        "createMicrosoftAuthorizationUrl(state: string, nonce: string, codeChallenge: string): string",
    },
    {
      name: "getMicrosoftProfile",
      description:
        "Exchanges the authorization code, verifies the Microsoft ID token, and retrieves the user's Microsoft Graph profile.",
      signature:
        "getMicrosoftProfile(code: string, codeVerifier: string, nonce: string): Promise<MicrosoftProfile>",
    },
    {
      name: "verifyOAuthState",
      description:
        "Validates the returned OAuth state against the value stored in the temporary cookie.",
      signature:
        "verifyOAuthState(receivedState: string, storedState: string): boolean",
    },
    {
      name: "verifyOAuthNonce",
      description:
        "Validates the nonce claim in the Microsoft ID token against the value stored in the temporary cookie.",
      signature:
        "verifyOAuthNonce(receivedNonce: string, storedNonce: string): boolean",
    },
    {
      name: "getOrCreateMicrosoftUser",
      description:
        "Finds an existing Microsoft-linked user or creates a new application user and links the Microsoft account.",
      signature:
        "getOrCreateMicrosoftUser(profile: MicrosoftProfile): Promise<AuthUser>",
    },
    {
      name: "createSession",
      description:
        "Creates a signed JWT application session and stores it in an HTTP-only cookie.",
      signature: "createSession(user: AuthUser): Promise<void>",
    },
    {
      name: "getSession",
      description:
        "Verifies the application session JWT and returns the authenticated user when valid.",
      signature: "getSession(): Promise<AuthUser | null>",
    },
    {
      name: "deleteSession",
      description: "Deletes the local application session cookie.",
      signature: "deleteSession(): Promise<void>",
    },
  ],

  environmentVariables: [
    {
      name: "DATABASE_URL",
      description: "Neon PostgreSQL database connection string.",
      required: true,
      example: "postgresql://user:password@host/database?sslmode=require",
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign application session JWTs. Must contain at least 32 bytes.",
      required: true,
      example: "replace_with_a_secure_random_secret",
    },
    {
      name: "MICROSOFT_CLIENT_ID",
      description: "Application (client) ID from Microsoft Entra.",
      required: true,
      example: "your_microsoft_application_client_id",
    },
    {
      name: "MICROSOFT_CLIENT_SECRET",
      description:
        "Client secret generated in the Microsoft Entra app registration.",
      required: true,
      example: "your_microsoft_client_secret",
    },
    {
      name: "MICROSOFT_REDIRECT_URI",
      description:
        "Callback URL registered in Microsoft Entra. Must exactly match the registered redirect URI.",
      required: true,
      example: "http://localhost:3000/api/auth/microsoft/callback",
    },
    {
      name: "APP_URL",
      description:
        "Base URL of the application used for authentication redirects.",
      required: true,
      example: "http://localhost:3000",
    },
  ],

  securityNotes: [
    {
      title: "OAuth state validation",
      description:
        "A cryptographically random state value is stored in an HTTP-only cookie and checked during the callback to protect against CSRF attacks.",
    },
    {
      title: "PKCE protection",
      description:
        "The authorization code flow uses a PKCE verifier and S256 challenge to protect authorization code exchanges.",
    },
    {
      title: "OIDC nonce validation",
      description:
        "The nonce generated before authorization is checked against the nonce claim in the verified ID token.",
    },
    {
      title: "ID token verification",
      description:
        "The implementation verifies the Microsoft ID token signature, audience, tenant-specific issuer, expiry, nonce, tenant ID, and object ID.",
    },
    {
      title: "Tenant-aware account identity",
      description:
        "Microsoft accounts are identified using the tenant ID and object ID rather than email addresses.",
    },
    {
      title: "Email is not treated as verified",
      description:
        "Microsoft Graph mail and userPrincipalName values are optional profile information. The implementation does not treat them as proof of verified email ownership or automatically link accounts by matching email.",
    },
    {
      title: "HTTP-only session cookie",
      description:
        "The application session is stored in an HTTP-only cookie with SameSite=Lax and the Secure flag enabled in production.",
    },
    {
      title: "Server-side secrets",
      description:
        "The Microsoft client secret and application session secret must remain server-side and must never be exposed to browser code.",
    },
    {
      title: "Additional production safeguards",
      description:
        "The template does not include IP-based rate limiting, centralized session revocation, or transaction-safe handling of concurrent user creation and account linking. Consider implementing these before production deployment.",
    },
  ],
};
