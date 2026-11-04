import type { TemplateDocumentation } from "@/types/auth";

export const discordOAuthDocumentation: TemplateDocumentation = {
  overview:
    "This boilerplate implements Discord OAuth2 authentication for Next.js App Router applications. It uses the OAuth2 authorization-code flow with state validation, retrieves the authenticated user's Discord profile and verified email address, stores users and linked provider accounts in Neon Postgres, and creates an application session using a signed JWT stored in an HTTP-only cookie.",

  files: [
    {
      path: "core/api/auth/discord/route.ts",
      description:
        "Starts Discord OAuth2 authentication by generating a state value, storing it in an HTTP-only cookie, and redirecting the user to Discord.",
      required: true,
    },
    {
      path: "core/api/auth/discord/callback/route.ts",
      description:
        "Handles the Discord OAuth2 callback, validates the state, completes token exchange, retrieves the Discord profile, creates or links the application user, and establishes a session.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description: "Deletes the current application session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Returns the currently authenticated application user or an unauthorized response.",
      required: true,
    },
    {
      path: "core/db/schema.sql",
      description:
        "Creates the users and oauth_accounts tables, including unique indexes for normalized email addresses and provider accounts.",
      required: true,
    },
    {
      path: "core/lib/discord-oauth.ts",
      description:
        "Builds the Discord authorization URL, exchanges authorization codes for access tokens, retrieves the Discord user profile, and requires a verified email address.",
      required: true,
    },
    {
      path: "core/lib/oauth-state.ts",
      description:
        "Generates cryptographically random OAuth state values and validates them using a timing-safe comparison.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Provides Neon database operations for finding users, creating application accounts, looking up linked Discord accounts, and linking provider accounts.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Coordinates Discord profile retrieval, application user lookup or creation, account linking, and session creation.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates, verifies, and deletes signed JWT application sessions using HTTP-only cookies.",
      required: true,
    },
    {
      path: "optional-ui/AuthButton.tsx",
      description:
        "Optional client component that displays the Discord sign-in button, current user information, and sign-out action.",
      required: false,
    },
    {
      path: ".env.example",
      description:
        "Documents the required database, session, Discord OAuth, redirect URL, and application URL environment variables.",
      required: true,
    },
    {
      path: "README.md",
      description:
        "Explains Discord application setup, environment configuration, database initialization, integration, API endpoints, and security considerations.",
      required: true,
    },
  ],

  functions: [
    {
      name: "generateOAuthState",
      description:
        "Generates a cryptographically random state value for an OAuth authorization attempt.",
      signature: "generateOAuthState(): string",
    },
    {
      name: "verifyOAuthState",
      description:
        "Compares the state returned by Discord with the state stored in the cookie using a timing-safe comparison.",
      signature:
        "verifyOAuthState(receivedState: string, storedState: string): boolean",
    },
    {
      name: "createDiscordAuthorizationUrl",
      description:
        "Builds the Discord OAuth2 authorization URL with the configured client ID, redirect URI, requested scopes, and state.",
      signature: "createDiscordAuthorizationUrl(state: string): string",
    },
    {
      name: "exchangeDiscordCode",
      description:
        "Exchanges a Discord authorization code for an OAuth2 access token.",
      signature: "exchangeDiscordCode(code: string): Promise<string>",
    },
    {
      name: "getDiscordProfile",
      description:
        "Retrieves the authenticated Discord user's profile and verified email address using the access token.",
      signature: "getDiscordProfile(accessToken: string): Promise<DiscordProfile>",
    },
    {
      name: "findUserByEmail",
      description:
        "Finds an application user by normalized email address.",
      signature: "findUserByEmail(email: string): Promise<AuthUser | null>",
    },
    {
      name: "findUserByDiscordAccount",
      description:
        "Finds an application user through the linked Discord provider account ID.",
      signature:
        "findUserByDiscordAccount(discordAccountId: string): Promise<AuthUser | null>",
    },
    {
      name: "getOrCreateDiscordUser",
      description:
        "Finds an existing linked Discord user or creates and links an application account using the verified Discord email address.",
      signature:
        "getOrCreateDiscordUser(profile: DiscordProfile): Promise<AuthUser>",
    },
    {
      name: "signInWithDiscord",
      description:
        "Coordinates Discord profile retrieval, application account lookup or creation, account linking, and session creation.",
      signature: "signInWithDiscord(code: string): Promise<void>",
    },
    {
      name: "createSession",
      description:
        "Creates a signed JWT session and stores it in an HTTP-only application cookie.",
      signature: "createSession(user: AuthUser): Promise<void>",
    },
    {
      name: "getSession",
      description:
        "Verifies the application session JWT and returns the authenticated user information.",
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
      description: "Neon Postgres database connection string.",
      required: true,
      example: "postgresql://user:password@host/database",
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign and verify application session JWTs. Must contain at least 32 bytes.",
      required: true,
      example: "generate-a-secure-random-secret",
    },
    {
      name: "DISCORD_CLIENT_ID",
      description: "Client ID of the Discord application.",
      required: true,
      example: "your-discord-client-id",
    },
    {
      name: "DISCORD_CLIENT_SECRET",
      description: "Client secret of the Discord application.",
      required: true,
      example: "your-discord-client-secret",
    },
    {
      name: "DISCORD_REDIRECT_URI",
      description:
        "Callback URL registered in the Discord Developer Portal.",
      required: true,
      example: "http://localhost:3000/api/auth/discord/callback",
    },
    {
      name: "APP_URL",
      description:
        "Base URL of the application, used when constructing redirect destinations.",
      required: true,
      example: "http://localhost:3000",
    },
  ],

  securityNotes: [
    {
      title: "OAuth state validation",
      description:
        "A cryptographically random state value is generated for each authorization attempt and compared with the callback value using a timing-safe comparison to protect against CSRF.",
    },
    {
      title: "Verified email requirement",
      description:
        "The implementation requires Discord to return an email address marked as verified. Authentication fails when a verified email is unavailable.",
    },
    {
      title: "Account linking",
      description:
        "Discord accounts are identified by their stable provider account ID. An existing application account can be linked when its email matches the verified Discord email.",
    },
    {
      title: "HTTP-only session cookie",
      description:
        "The application session is stored in an HTTP-only cookie, preventing client-side JavaScript from directly reading the session token.",
    },
    {
      title: "Secret management",
      description:
        "Discord credentials, database credentials, and the application session secret must remain server-side and must not be exposed through client-side environment variables.",
    },
    {
      title: "No provider token persistence",
      description:
        "Discord access and refresh tokens are not persisted. This implementation establishes application authentication but does not provide ongoing authenticated Discord API access.",
    },
    {
      title: "No centralized session revocation",
      description:
        "Deleting the session cookie signs the user out locally. Existing JWTs are not centrally revoked before their expiration.",
    },
    {
      title: "Rate limiting",
      description:
        "The reference implementation does not include IP-based rate limiting for OAuth endpoints. Add appropriate rate limits and monitoring before production deployment.",
    },
  ],
};
