import type { TemplateDocumentation } from "@/types/auth";

export const googleOAuthDocumentation: TemplateDocumentation = {
  overview:
    "A headless Google OAuth authentication implementation for Next.js App Router. It includes the Google OAuth 2.0 authorization-code flow, OpenID Connect, PKCE, CSRF state validation, Google ID token verification, account linking, JWT session management, and a Neon PostgreSQL database adapter, with an optional reference UI.",

  files: [
    {
      path: "README.md",
      description:
        "Explains the Google OAuth architecture, dependencies, Google Cloud Console configuration, environment variables, database setup, installation, authentication flow, API routes, and security considerations.",
      required: true,
    },
    {
      path: ".env.example",
      description:
        "Lists the environment variables required for Neon PostgreSQL, JWT session signing, Google OAuth credentials, callback URL, and application URL.",
      required: true,
    },
    {
      path: "core/db/schema.sql",
      description:
        "Defines the users and oauth_accounts tables, including case-insensitive unique email indexing and unique provider-account constraints.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Coordinates Google profile retrieval, user lookup or creation, Google account linking, and application session creation.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Implements Neon database operations for finding users, creating users, finding linked Google accounts, and linking Google accounts to application users.",
      required: true,
    },
    {
      path: "core/lib/google-oauth.ts",
      description:
        "Builds the Google authorization URL, exchanges authorization codes using PKCE, verifies Google ID tokens using Google's remote signing keys, and retrieves the verified Google profile.",
      required: true,
    },
    {
      path: "core/lib/oauth-state.ts",
      description:
        "Generates cryptographically secure OAuth state values and PKCE code verifiers, creates S256 code challenges, and validates returned state values.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates and verifies signed JWT application session tokens and manages the HTTP-only authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/google/route.ts",
      description:
        "Starts Google sign-in by generating OAuth state and PKCE values, storing them in short-lived HTTP-only cookies, and redirecting the user to Google's authorization endpoint.",
      required: true,
    },
    {
      path: "core/api/auth/google/callback/route.ts",
      description:
        "Handles Google's authorization callback, validates the state and PKCE cookies, completes Google authentication, establishes an application session, and redirects the user.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description:
        "Clears the authentication session cookie and logs out the current browser session.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Verifies the current application session and returns the authenticated user's public information.",
      required: true,
    },
    {
      path: "optional-ui/AuthButton.tsx",
      description:
        "Provides an optional reference UI demonstrating Google sign-in, session checking, authenticated user display, and logout.",
      required: false,
    },
  ],

  functions: [
    {
      name: "generateOAuthState",
      description:
        "Generates a cryptographically secure random state value for OAuth CSRF protection.",
      signature: "generateOAuthState(): string",
    },
    {
      name: "generateCodeVerifier",
      description:
        "Generates a random PKCE code verifier.",
      signature: "generateCodeVerifier(): string",
    },
    {
      name: "generateCodeChallenge",
      description:
        "Creates an S256 code challenge from a PKCE code verifier.",
      signature: "generateCodeChallenge(verifier: string): string",
    },
    {
      name: "verifyOAuthState",
      description:
        "Safely compares the state returned by Google with the state stored in the browser cookie.",
      signature:
        "verifyOAuthState(receivedState: string, storedState: string): boolean",
    },
    {
      name: "createGoogleAuthorizationUrl",
      description:
        "Builds the Google authorization URL with OpenID Connect scopes, OAuth state, and the PKCE challenge.",
      signature:
        "createGoogleAuthorizationUrl(state: string, codeVerifier: string): string",
    },
    {
      name: "exchangeGoogleCode",
      description:
        "Exchanges the Google authorization code and PKCE verifier for an OAuth token response.",
      signature:
        "exchangeGoogleCode(code: string, codeVerifier: string): Promise<GoogleTokenResponse>",
    },
    {
      name: "verifyGoogleIdToken",
      description:
        "Verifies the Google ID token signature, issuer, and audience, then validates the identity claims.",
      signature:
        "verifyGoogleIdToken(idToken: string): Promise<GoogleProfile>",
    },
    {
      name: "getGoogleProfile",
      description:
        "Exchanges the authorization code and retrieves the verified Google user profile.",
      signature:
        "getGoogleProfile(code: string, codeVerifier: string): Promise<GoogleProfile>",
    },
    {
      name: "getOrCreateGoogleUser",
      description:
        "Finds an existing linked Google account, links a verified matching email to an existing application user, or creates a new user and Google account link.",
      signature:
        "getOrCreateGoogleUser(profile: GoogleProfile): Promise<AuthUser>",
    },
    {
      name: "signInWithGoogle",
      description:
        "Coordinates Google profile verification, user lookup or creation, account linking, and application session creation.",
      signature:
        "signInWithGoogle(code: string, codeVerifier: string): Promise<void>",
    },
    {
      name: "createSession",
      description:
        "Creates a signed JWT application session and stores it in an HTTP-only cookie.",
      signature: "createSession(user: AuthUser): Promise<void>",
    },
    {
      name: "getCurrentUser",
      description:
        "Verifies the application session JWT and returns the authenticated user.",
      signature: "getCurrentUser(): Promise<AuthUser | null>",
    },
    {
      name: "deleteSession",
      description:
        "Clears the application authentication session cookie.",
      signature: "deleteSession(): Promise<void>",
    },
  ],

  environmentVariables: [
    {
      name: "DATABASE_URL",
      description:
        "Connection string for the Neon PostgreSQL database.",
      required: true,
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign and verify application session tokens. Configure a strong random secret containing at least 32 bytes.",
      required: true,
    },
    {
      name: "GOOGLE_CLIENT_ID",
      description:
        "OAuth 2.0 client ID created in the Google Cloud Console.",
      required: true,
    },
    {
      name: "GOOGLE_CLIENT_SECRET",
      description:
        "OAuth 2.0 client secret associated with the Google OAuth client.",
      required: true,
    },
    {
      name: "GOOGLE_REDIRECT_URI",
      description:
        "Callback URL registered in Google Cloud Console. It must match the redirect URI used by the application.",
      required: true,
    },
    {
      name: "APP_URL",
      description:
        "Base URL of the application, used to construct post-authentication redirects.",
      required: true,
    },
  ],

  securityNotes: [
    {
      title: "OAuth state validation",
      description:
        "A cryptographically random state value is stored in an HTTP-only cookie and validated during the callback to help protect against CSRF attacks.",
    },
    {
      title: "PKCE protection",
      description:
        "The authorization flow uses an S256 PKCE challenge. The code verifier is stored in a short-lived HTTP-only cookie and supplied during token exchange.",
    },
    {
      title: "Google ID token verification",
      description:
        "The ID token is verified using Google's remote signing keys. The implementation checks the issuer, audience, subject, email, and verified-email claim.",
    },
    {
      title: "Verified email account linking",
      description:
        "Google accounts are linked to existing application users using a matching verified email address. Review this policy against your application's account-linking and account-recovery requirements.",
    },
    {
      title: "Session cookie protection",
      description:
        "The session cookie uses HTTP-only, SameSite=Lax, and Secure in production settings. Review your deployment and HTTPS configuration before production use.",
    },
    {
      title: "Session revocation",
      description:
        "Logout clears the browser cookie, but already-issued session tokens remain valid until expiration. Add server-side revocation if immediate invalidation is required.",
    },
    {
      title: "Google refresh tokens",
      description:
        "This implementation authenticates users through Google and creates a separate application session. It does not request or persist a Google refresh token.",
    },
    {
      title: "Callback considerations",
      description:
        "The OAuth callback completes authentication through a GET request. Review callback behavior with link scanners and security middleware before production deployment.",
    },
  ],
};
