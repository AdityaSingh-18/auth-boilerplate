import type { TemplateDocumentation } from "@/types/auth";

export const facebookOAuthDocumentation: TemplateDocumentation = {
  overview:
    "This template implements Facebook OAuth 2.0 authentication for Next.js App Router applications. It uses the authorization-code flow, validates OAuth state, exchanges authorization codes for access tokens, validates tokens through the Facebook Graph API, retrieves the user's profile, stores users and OAuth accounts in Neon PostgreSQL, and creates JWT-based application sessions.",

  files: [
    {
      path: "core/api/auth/facebook/route.ts",
      description:
        "Starts Facebook OAuth by generating a state value, storing it in an HTTP-only cookie, and redirecting the user to Facebook.",
      required: true,
    },
    {
      path: "core/api/auth/facebook/callback/route.ts",
      description:
        "Handles Facebook's OAuth callback, validates the returned state, exchanges the authorization code, creates the application session, and redirects the user.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description:
        "Clears the current authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Returns the currently authenticated user from the session cookie.",
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
        "Coordinates Facebook authorization-code exchange, profile retrieval, user lookup or creation, and session creation.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Implements Neon PostgreSQL operations for finding users, creating users, and linking Facebook accounts.",
      required: true,
    },
    {
      path: "core/lib/facebook-oauth.ts",
      description:
        "Exchanges Facebook authorization codes, validates access tokens, generates appsecret_proof values, and retrieves Facebook profiles.",
      required: true,
    },
    {
      path: "core/lib/oauth-state.ts",
      description:
        "Generates cryptographically random OAuth state values and compares returned state values using timing-safe comparison.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates, verifies, and deletes seven-day JWT authentication sessions stored in HTTP-only cookies.",
      required: true,
    },
    {
      path: "optional-ui/AuthButton.tsx",
      description:
        "Optional client-side Facebook sign-in and sign-out component that displays the current user's basic profile information.",
      required: false,
    },
    {
      path: ".env.example",
      description:
        "Documents the environment variables required for Neon, session signing, Facebook OAuth, and the application URL.",
      required: true,
    },
    {
      path: "README.md",
      description:
        "Explains installation, Meta app configuration, environment variables, database setup, authentication flow, API endpoints, and security considerations.",
      required: true,
    },
  ],

  functions: [
    {
      name: "generateOAuthState",
      description:
        "Generates a cryptographically random value for the OAuth state parameter.",
      signature: "() => string",
    },
    {
      name: "verifyOAuthState",
      description:
        "Compares the state returned by Facebook with the value stored in the browser cookie using timing-safe comparison.",
      signature: "(receivedState: string, storedState: string) => boolean",
    },
    {
      name: "exchangeFacebookCode",
      description:
        "Exchanges a Facebook authorization code for an access token.",
      signature: "(code: string) => Promise<string>",
    },
    {
      name: "verifyFacebookAccessToken",
      description:
        "Validates a Facebook access token through the Graph API token-debugging endpoint and checks that it belongs to the configured application.",
      signature: "(accessToken: string) => Promise<void>",
    },
    {
      name: "getFacebookProfile",
      description:
        "Validates the access token and retrieves the Facebook user ID, name, optional email, and optional profile image.",
      signature: "(accessToken: string) => Promise<FacebookProfile>",
    },
    {
      name: "findUserByFacebookAccount",
      description:
        "Finds an application user using the linked Facebook provider account ID.",
      signature: "(facebookUserId: string) => Promise<AuthUser | null>",
    },
    {
      name: "findUserByEmail",
      description:
        "Finds an application user by case-insensitive email address.",
      signature: "(email: string) => Promise<AuthUser | null>",
    },
    {
      name: "getOrCreateFacebookUser",
      description:
        "Returns an existing Facebook-linked user or creates a new user and links the Facebook account. It does not automatically link an existing account based on email.",
      signature: "(profile: FacebookProfile) => Promise<AuthUser>",
    },
    {
      name: "createSession",
      description:
        "Creates a signed JWT session and stores it in an HTTP-only cookie.",
      signature: "(user: AuthUser) => Promise<void>",
    },
    {
      name: "getSession",
      description:
        "Verifies the session JWT and returns the authenticated user, or null when the session is missing or invalid.",
      signature: "() => Promise<AuthUser | null>",
    },
    {
      name: "deleteSession",
      description:
        "Clears the authentication session cookie.",
      signature: "() => Promise<void>",
    },
    {
      name: "signInWithFacebook",
      description:
        "Coordinates authorization-code exchange, Facebook profile retrieval, database user lookup or creation, and session creation.",
      signature: "(code: string) => Promise<void>",
    },
  ],

  environmentVariables: [
    {
      name: "DATABASE_URL",
      description:
        "Neon PostgreSQL connection string used by the database adapter.",
      required: true,
      example: "postgresql://user:password@host/database",
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign and verify session JWTs. Must contain at least 32 bytes.",
      required: true,
    },
    {
      name: "FACEBOOK_APP_ID",
      description:
        "Application ID from the Meta developer dashboard.",
      required: true,
    },
    {
      name: "FACEBOOK_APP_SECRET",
      description:
        "Application secret from the Meta developer dashboard. Used for token exchange and appsecret_proof generation.",
      required: true,
    },
    {
      name: "FACEBOOK_REDIRECT_URI",
      description:
        "Callback URL registered in the Meta app's Facebook Login settings. It must exactly match the redirect URI used during authorization.",
      required: true,
      example:
        "http://localhost:3000/api/auth/facebook/callback",
    },
    {
      name: "FACEBOOK_GRAPH_API_VERSION",
      description:
        "Facebook Graph API version used for authorization and API requests.",
      required: false,
      example: "v26.0",
    },
    {
      name: "APP_URL",
      description:
        "Base URL used when redirecting users after authentication or errors.",
      required: false,
      example: "http://localhost:3000",
    },
  ],

  securityNotes: [
    {
      title: "OAuth state validation",
      description:
        "A cryptographically random state value is stored in an HTTP-only cookie and checked during the callback to protect against OAuth CSRF attacks.",
    },
    {
      title: "Access-token validation",
      description:
        "The Facebook access token is checked through the Graph API token-debugging endpoint. The implementation verifies that the token is valid, has a user ID, and belongs to the configured Facebook application.",
    },
    {
      title: "App secret proof",
      description:
        "Graph API profile requests include an appsecret_proof generated using HMAC-SHA256 and the Facebook App Secret.",
    },
    {
      title: "Session protection",
      description:
        "Session JWTs are signed with HS256 and stored in HTTP-only cookies. Cookies use SameSite=Lax and Secure in production.",
    },
    {
      title: "No automatic email linking",
      description:
        "An existing application account is not automatically linked to Facebook based on email. The user must authenticate through their existing method before an account-linking flow can be implemented.",
    },
    {
      title: "Email is not verified",
      description:
        "The implementation does not independently verify Facebook email ownership. The email_verified database field remains false.",
    },
    {
      title: "Session revocation limitation",
      description:
        "Logout removes the browser's session cookie but does not revoke an already issued JWT. A copied token remains usable until expiration.",
    },
    {
      title: "Non-transactional account creation",
      description:
        "User creation and Facebook account linking are separate database operations. A failure between them can leave an unlinked user record.",
    },
  ],
};
