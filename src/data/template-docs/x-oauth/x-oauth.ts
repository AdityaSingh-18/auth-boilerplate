import type { TemplateDocumentation } from "@/types/auth";

export const xOAuthDocumentation: TemplateDocumentation = {
  overview:
    "X (Twitter) OAuth 2.0 authentication using Authorization Code Flow with PKCE (S256). The implementation exchanges authorization codes, retrieves the authenticated X user's profile, stores the provider account in Neon PostgreSQL, and creates a JWT-based application session.",

  files: [
    {
      path: "core/api/auth/x/route.ts",
      description:
        "Starts X OAuth authentication, generates state and PKCE values, stores them in HTTP-only cookies, and redirects the user to X.",
      required: true,
    },
    {
      path: "core/api/auth/x/callback/route.ts",
      description:
        "Validates OAuth state, retrieves the PKCE verifier, exchanges the authorization code, and creates the application session.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description: "Clears the current authentication session cookie.",
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
        "Creates the users and oauth_accounts tables and their indexes.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Coordinates X token exchange, profile retrieval, user lookup or creation, account linking, and session creation.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Implements Neon PostgreSQL queries for users and X OAuth account relationships.",
      required: true,
    },
    {
      path: "core/lib/oauth-state.ts",
      description:
        "Generates OAuth state and PKCE values, derives the S256 challenge, and validates callback state.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates, verifies, and clears JWT-based application sessions.",
      required: true,
    },
    {
      path: "core/lib/x-oauth.ts",
      description:
        "Builds the X authorization URL, exchanges authorization codes, and retrieves the authenticated user's X profile.",
      required: true,
    },
    {
      path: "optional-ui/AuthButton.tsx",
      description:
        "Optional client-side sign-in, session display, and sign-out component.",
      required: false,
    },
    {
      path: ".env.example",
      description:
        "Documents the required database, session, X OAuth, and application URL environment variables.",
      required: true,
    },
    {
      path: "README.md",
      description:
        "Explains setup, X Developer Portal configuration, database installation, OAuth flow, API endpoints, and security limitations.",
      required: true,
    },
  ],

  functions: [
    {
      name: "generateRandomValue",
      description:
        "Generates a cryptographically secure random value for OAuth state and the PKCE verifier.",
      signature: "generateRandomValue(bytes?: number): string",
    },
    {
      name: "generateCodeChallenge",
      description:
        "Creates the SHA-256 base64url PKCE code challenge from a verifier.",
      signature: "generateCodeChallenge(verifier: string): string",
    },
    {
      name: "isValidOAuthState",
      description:
        "Compares the callback state with the stored state using a timing-safe comparison.",
      signature:
        "isValidOAuthState(receivedState: string, storedState: string): boolean",
    },
    {
      name: "buildXAuthorizationUrl",
      description:
        "Builds the X OAuth 2.0 authorization URL with the requested scope, state, and PKCE challenge.",
      signature:
        "buildXAuthorizationUrl(state: string, codeChallenge: string): string",
    },
    {
      name: "exchangeXCode",
      description:
        "Exchanges an authorization code and PKCE verifier for X OAuth tokens.",
      signature:
        "exchangeXCode(code: string, codeVerifier: string): Promise<XTokenResponse>",
    },
    {
      name: "getXProfile",
      description:
        "Retrieves and validates the authenticated X user's ID, username, display name, and profile image.",
      signature:
        "getXProfile(accessToken: string): Promise<XProfile>",
    },
    {
      name: "findUserByXAccount",
      description:
        "Finds an application user through the linked X provider account ID.",
      signature:
        "findUserByXAccount(providerAccountId: string): Promise<AuthUser | null>",
    },
    {
      name: "createUser",
      description:
        "Creates an application user from the retrieved X profile.",
      signature:
        "createUser(profile: XProfile): Promise<AuthUser>",
    },
    {
      name: "linkXAccount",
      description:
        "Links an X provider account to an application user and verifies that the account is not owned by another user.",
      signature:
        "linkXAccount(userId: string, providerAccountId: string): Promise<void>",
    },
    {
      name: "getOrCreateXUser",
      description:
        "Finds an existing X-linked user or creates a new user and links the X account.",
      signature:
        "getOrCreateXUser(profile: XProfile): Promise<AuthUser>",
    },
    {
      name: "createSession",
      description:
        "Signs a JWT session and stores it in an HTTP-only cookie.",
      signature: "createSession(user: AuthUser): Promise<void>",
    },
    {
      name: "getSession",
      description:
        "Verifies the session JWT and returns the authenticated user claims.",
      signature: "getSession(): Promise<SessionUser | null>",
    },
    {
      name: "deleteSession",
      description: "Clears the authentication session cookie.",
      signature: "deleteSession(): Promise<void>",
    },
    {
      name: "signInWithX",
      description:
        "Coordinates the X OAuth token exchange, profile lookup, database operations, and session creation.",
      signature:
        "signInWithX(code: string, codeVerifier: string): Promise<void>",
    },
  ],

  environmentVariables: [
    {
      name: "DATABASE_URL",
      description: "Neon PostgreSQL database connection string.",
      required: true,
      example: "postgresql://user:password@host/database",
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign and verify session JWTs. Must contain at least 32 bytes.",
      required: true,
      example: "replace_with_a_random_secret_at_least_32_bytes_long",
    },
    {
      name: "X_CLIENT_ID",
      description: "X OAuth 2.0 application Client ID.",
      required: true,
      example: "your_x_oauth2_client_id",
    },
    {
      name: "X_CLIENT_SECRET",
      description:
        "X OAuth 2.0 application Client Secret used during token exchange.",
      required: true,
      example: "your_x_oauth2_client_secret",
    },
    {
      name: "X_REDIRECT_URI",
      description:
        "Registered X OAuth callback URL. Must match the Developer Portal configuration.",
      required: true,
      example:
        "https://your-domain.com/api/auth/x/callback",
    },
    {
      name: "APP_URL",
      description:
        "Base URL used for redirects after authentication.",
      required: true,
      example: "https://your-domain.com",
    },
  ],

  securityNotes: [
    {
      title: "PKCE protection",
      description:
        "Uses the S256 PKCE challenge method to bind the authorization code exchange to the original authorization request.",
    },
    {
      title: "OAuth state validation",
      description:
        "Generates a cryptographically secure state value and validates it during the callback using a timing-safe comparison.",
    },
    {
      title: "HTTP-only OAuth cookies",
      description:
        "Stores the OAuth state and PKCE verifier in HTTP-only cookies with a limited lifetime.",
    },
    {
      title: "Session cookie protection",
      description:
        "Uses HTTP-only cookies, SameSite Lax, and Secure in production for application sessions.",
    },
    {
      title: "Server-side client credentials",
      description:
        "The X Client Secret is used only by server-side code and must never be exposed to browser code.",
    },
    {
      title: "Stable provider account identifier",
      description:
        "Uses the X user ID rather than the username to identify linked provider accounts.",
    },
    {
      title: "No automatic email linking",
      description:
        "The implementation does not request an email address or automatically link existing accounts by email.",
    },
    {
      title: "Session revocation limitation",
      description:
        "Logout clears the browser session cookie but does not revoke an already-issued JWT on the server.",
    },
    {
      title: "Non-transactional account creation",
      description:
        "User creation and OAuth account linking are separate database operations. A linking failure can leave an unlinked user record.",
    },
    {
      title: "No IP-based rate limiting",
      description:
        "The reference implementation does not include IP-based rate limiting for OAuth or session endpoints.",
    },
  ],
};
