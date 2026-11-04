import type { TemplateDocumentation } from "@/types/auth";

export const appleOAuthDocumentation: TemplateDocumentation = {
  overview:
    "This template implements Sign in with Apple for Next.js App Router applications. It uses Apple's OAuth 2.0 authorization-code flow with form_post callback handling, server-generated ES256 client secret JWTs, OAuth state and nonce validation, Apple ID token verification, Neon PostgreSQL account storage, and signed JWT application sessions.",

  files: [
    {
      path: "core/api/auth/apple/route.ts",
      description:
        "Starts the Apple sign-in flow by generating OAuth state and nonce values, creating the authorization URL, and setting temporary HTTP-only cookies.",
      required: true,
    },
    {
      path: "core/api/auth/apple/callback/route.ts",
      description:
        "Handles Apple's form_post callback, validates OAuth state, exchanges the authorization code, verifies the ID token, and establishes the application session.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description: "Clears the application session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Returns the currently authenticated user from the application session.",
      required: true,
    },
    {
      path: "core/db/schema.sql",
      description:
        "Creates the users and oauth_accounts tables and their indexes for storing application users and linked Apple accounts.",
      required: true,
    },
    {
      path: "core/lib/apple-oauth.ts",
      description:
        "Generates Apple's ES256 client secret JWT, builds the authorization URL, exchanges authorization codes, and verifies Apple ID tokens using Apple's public keys.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Provides Neon database operations for finding users, creating users, and linking Apple provider accounts.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Coordinates Apple profile verification, user lookup or creation, account linking, and application session creation.",
      required: true,
    },
    {
      path: "core/lib/oauth-state.ts",
      description:
        "Generates OAuth state and nonce values and provides timing-safe state comparison.",
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
        "Optional client-side component that displays the Apple sign-in button or the current user's session and sign-out control.",
      required: false,
    },
    {
      path: ".env.example",
      description:
        "Documents the database, session, Apple Developer credentials, callback URL, and application URL environment variables.",
      required: true,
    },
    {
      path: "README.md",
      description:
        "Explains Apple Developer configuration, installation, environment variables, database setup, authentication flow, API endpoints, and security considerations.",
      required: true,
    },
  ],

  functions: [
    {
      name: "generateAppleClientSecret",
      description:
        "Generates a signed ES256 JWT used as the client secret when communicating with Apple's token endpoint.",
      signature: "generateAppleClientSecret(): Promise<string>",
    },
    {
      name: "createAppleAuthorizationUrl",
      description:
        "Builds Apple's authorization URL with the configured client ID, redirect URI, response mode, state, nonce, and requested scopes.",
      signature:
        "createAppleAuthorizationUrl(state: string, nonce: string): Promise<string>",
    },
    {
      name: "exchangeAppleCode",
      description:
        "Exchanges an Apple authorization code for the token response using the generated client secret.",
      signature:
        "exchangeAppleCode(code: string): Promise<AppleTokenResponse>",
    },
    {
      name: "verifyAppleIdToken",
      description:
        "Verifies the Apple ID token signature and validates its issuer, audience, subject, and nonce.",
      signature:
        "verifyAppleIdToken(idToken: string, expectedNonce: string): Promise<AppleProfile>",
    },
    {
      name: "getAppleProfile",
      description:
        "Exchanges the authorization code and returns the verified Apple profile.",
      signature:
        "getAppleProfile(code: string, expectedNonce: string): Promise<AppleProfile>",
    },
    {
      name: "generateOAuthState",
      description: "Generates a cryptographically random OAuth state value.",
      signature: "generateOAuthState(): string",
    },
    {
      name: "generateOAuthNonce",
      description: "Generates a cryptographically random nonce value.",
      signature: "generateOAuthNonce(): string",
    },
    {
      name: "verifyOAuthState",
      description:
        "Compares the callback state with the stored state using a timing-safe comparison.",
      signature:
        "verifyOAuthState(receivedState: string, storedState: string): boolean",
    },
    {
      name: "getOrCreateAppleUser",
      description:
        "Finds an existing user linked to the Apple account or creates a new user and links the Apple provider account.",
      signature:
        "getOrCreateAppleUser(profile: AppleProfile, name: string | null): Promise<AuthUser>",
    },
    {
      name: "signInWithApple",
      description:
        "Verifies the Apple profile, resolves the application user, and creates the application session.",
      signature:
        "signInWithApple(code: string, nonce: string, name: string | null): Promise<AuthUser>",
    },
    {
      name: "createSession",
      description:
        "Creates a signed JWT session and stores it in an HTTP-only cookie.",
      signature: "createSession(user: AuthUser): Promise<void>",
    },
    {
      name: "getSession",
      description:
        "Reads and verifies the application session cookie and returns the authenticated user.",
      signature: "getSession(): Promise<AuthUser | null>",
    },
    {
      name: "deleteSession",
      description: "Deletes the application session cookie.",
      signature: "deleteSession(): Promise<void>",
    },
  ],

  environmentVariables: [
    {
      name: "DATABASE_URL",
      description: "Neon PostgreSQL connection string.",
      required: true,
      example: "postgresql://user:password@host/database",
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign application session JWTs. Use a strong random value of at least 32 bytes.",
      required: true,
      example: "your_random_session_secret",
    },
    {
      name: "APPLE_CLIENT_ID",
      description: "Apple Services ID used as the OAuth client identifier.",
      required: true,
      example: "com.example.web",
    },
    {
      name: "APPLE_TEAM_ID",
      description: "Apple Developer Team ID used to generate the client secret.",
      required: true,
      example: "YOUR_APPLE_TEAM_ID",
    },
    {
      name: "APPLE_KEY_ID",
      description: "Key ID of the Sign in with Apple private key.",
      required: true,
      example: "YOUR_APPLE_KEY_ID",
    },
    {
      name: "APPLE_PRIVATE_KEY",
      description:
        "Contents of the Apple Sign in with Apple .p8 private key. Keep this value server-side.",
      required: true,
      example: "-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_CONTENT\\n-----END PRIVATE KEY-----",
    },
    {
      name: "APPLE_REDIRECT_URI",
      description:
        "HTTPS callback URL registered in the Apple Developer configuration.",
      required: true,
      example: "https://your-domain.com/api/auth/apple/callback",
    },
    {
      name: "APP_URL",
      description: "Base URL of the application.",
      required: true,
      example: "https://your-domain.com",
    },
  ],

  securityNotes: [
    {
      title: "Protect the Apple private key",
      description:
        "The .p8 private key is used to sign Apple client secret JWTs. Keep it in server-side environment variables and never expose it to browser code or commit it to source control.",
    },
    {
      title: "Validate OAuth state",
      description:
        "The callback compares the returned state with the temporary state cookie using a timing-safe comparison to protect against login CSRF.",
    },
    {
      title: "Validate the nonce",
      description:
        "The nonce in the verified Apple ID token must match the nonce generated for the authentication attempt.",
    },
    {
      title: "Verify Apple ID tokens",
      description:
        "Validate the token signature using Apple's public signing keys, along with the expected issuer, audience, subject, and nonce.",
    },
    {
      title: "Use HTTPS for form_post",
      description:
        "The cross-site form_post callback requires the temporary state and nonce cookies to use SameSite=None and Secure. Use HTTPS for the callback flow.",
    },
    {
      title: "Protect application sessions",
      description:
        "Application sessions use signed JWTs stored in HTTP-only cookies. Keep AUTH_SECRET strong and private.",
    },
    {
      title: "Persist the initial profile information",
      description:
        "Apple may provide the user's name only during the initial authorization. Persist available name and email information when it is first received.",
    },
    {
      title: "Review database transaction handling",
      description:
        "User creation and Apple account linking are separate database operations in this reference implementation. Consider using a transaction and handling concurrent account-linking attempts in production.",
    },
  ],
};
