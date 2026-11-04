import type { TemplateDocumentation } from "@/types/auth";

export const githubOAuthDocumentation: TemplateDocumentation = {
  overview:
    "GitHub OAuth authentication boilerplate for Next.js App Router. It redirects users to GitHub for authorization, validates the OAuth state, exchanges the authorization code for an access token, retrieves the GitHub profile and primary verified email, and creates or links a local user account. Authenticated users receive a signed JWT session stored in an HTTP-only cookie.",

  files: [
    {
      path: "core/api/auth/github/route.ts",
      description:
        "Starts the GitHub OAuth flow by generating a cryptographically random state value, building the GitHub authorization URL, storing the state in a secure HTTP-only cookie, and redirecting the user to GitHub.",
      required: true,
    },
    {
      path: "core/api/auth/github/callback/route.ts",
      description:
        "Handles GitHub's OAuth callback. It validates the returned state against the state cookie, exchanges the authorization code, retrieves the GitHub profile and primary verified email, creates or links the local account, establishes a session, and redirects the user.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description:
        "Handles logout by deleting the local authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Returns the currently authenticated user's profile or an unauthorized response when no valid session exists.",
      required: true,
    },
    {
      path: "core/db/schema.sql",
      description:
        "Creates the users and oauth_accounts tables, including a case-insensitive unique email index and a unique provider/account identifier constraint.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Coordinates GitHub sign-in by retrieving the GitHub profile, finding or creating the local user, linking the GitHub account, and creating the application session.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Contains Neon database operations for finding users by ID, email, or GitHub account, creating users, linking GitHub accounts, and retrieving or creating the authenticated user.",
      required: true,
    },
    {
      path: "core/lib/github-oauth.ts",
      description:
        "Builds the GitHub authorization URL, exchanges authorization codes for access tokens, fetches the GitHub user profile, and retrieves the primary verified email from GitHub's REST API.",
      required: true,
    },
    {
      path: "core/lib/oauth-state.ts",
      description:
        "Generates cryptographically random OAuth state values and compares the returned state with the stored value using a timing-safe comparison.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates, verifies, retrieves, and deletes the local JWT session stored in an HTTP-only cookie.",
      required: true,
    },
    {
      path: "optional-ui/AuthButton.tsx",
      description:
        "Optional client-side example component that checks the current session, starts GitHub sign-in, displays the authenticated user, and handles logout.",
      required: false,
    },
    {
      path: ".env.example",
      description:
        "Documents the database connection string, session secret, GitHub OAuth credentials, callback URL, and application URL required by the template.",
      required: true,
    },
    {
      path: "README.md",
      description:
        "Explains installation, GitHub OAuth App configuration, environment variables, database setup, authentication flow, API endpoints, and security considerations.",
      required: true,
    },
  ],

  functions: [
    {
      name: "createGitHubAuthorizationUrl",
      description:
        "Builds the GitHub authorization URL with the client ID, callback URL, requested scopes, and OAuth state.",
      signature: "(state: string) => string",
      example: `const authorizationUrl = createGitHubAuthorizationUrl(state);
redirect(authorizationUrl);`,
    },
    {
      name: "getGitHubProfile",
      description:
        "Exchanges a GitHub authorization code for an access token, fetches the GitHub user profile and primary verified email, and returns a normalized profile.",
      signature: "(code: string) => Promise<GitHubProfile>",
      example: `const profile = await getGitHubProfile(code);

console.log(profile.email);
console.log(profile.id);`,
    },
    {
      name: "verifyOAuthState",
      description:
        "Compares the OAuth state received from GitHub with the state stored in the browser cookie using a timing-safe comparison.",
      signature: "(receivedState: string, storedState: string) => boolean",
      example: `const isValid = verifyOAuthState(
  callbackState,
  storedState
);

if (!isValid) {
  throw new Error("Invalid OAuth state.");
}`,
    },
    {
      name: "findUserByGitHubAccount",
      description:
        "Finds a local user by joining the OAuth accounts table with the users table using the GitHub provider account ID.",
      signature: "(githubId: string) => Promise<AuthUser | null>",
      example: `const user = await findUserByGitHubAccount(
  profile.id
);`,
    },
    {
      name: "getOrCreateGitHubUser",
      description:
        "Retrieves an existing GitHub-linked user or finds or creates a local user using the primary verified GitHub email, then links the GitHub account.",
      signature: "(profile: GitHubProfile) => Promise<AuthUser>",
      example: `const user = await getOrCreateGitHubUser(profile);`,
    },
    {
      name: "createSession",
      description:
        "Signs a JWT containing the authenticated user's identity and stores it in the HTTP-only session cookie.",
      signature: "(user: AuthUser) => Promise<void>",
      example: `await createSession(user);`,
    },
    {
      name: "getCurrentUser",
      description:
        "Reads and verifies the session JWT and returns the authenticated user information, or null when the session is missing or invalid.",
      signature: "() => Promise<AuthUser | null>",
      example: `const user = await getCurrentUser();

if (!user) {
  return Response.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}`,
    },
    {
      name: "deleteSession",
      description:
        "Deletes the local authentication session cookie during logout.",
      signature: "() => Promise<void>",
      example: `await deleteSession();`,
    },
  ],

  environmentVariables: [
    {
      name: "DATABASE_URL",
      description:
        "Neon PostgreSQL connection string used by the authentication database.",
      required: true,
      example: "postgresql://user:password@host/database?sslmode=require",
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign and verify JWT session tokens. Use a cryptographically random secret with at least 32 bytes.",
      required: true,
      example: "your_long_random_session_secret",
    },
    {
      name: "GITHUB_CLIENT_ID",
      description:
        "Client ID of the GitHub OAuth App created in GitHub Developer Settings.",
      required: true,
      example: "your_github_client_id",
    },
    {
      name: "GITHUB_CLIENT_SECRET",
      description:
        "Client secret of the GitHub OAuth App. Keep this value private and never expose it to client-side code.",
      required: true,
      example: "your_github_client_secret",
    },
    {
      name: "GITHUB_REDIRECT_URI",
      description:
        "Callback URL registered in the GitHub OAuth App settings. It must match the callback URL used by the application.",
      required: true,
      example: "http://localhost:3000/api/auth/github/callback",
    },
    {
      name: "APP_URL",
      description:
        "Base URL of the application used when constructing redirects after authentication.",
      required: true,
      example: "http://localhost:3000",
    },
  ],

  securityNotes: [
    {
      title: "OAuth state validation",
      description:
        "A cryptographically random state value is stored in an HTTP-only cookie and compared with the state returned by GitHub. This protects the callback against login CSRF when the state cookie and callback validation are correctly configured.",
    },
    {
      title: "Primary verified email",
      description:
        "The implementation requests the read:user and user:email scopes and retrieves the user's primary verified email from GitHub. It does not rely only on the potentially private email field in the public profile response.",
    },
    {
      title: "Server-side credentials",
      description:
        "The GitHub client secret, database connection string, and session signing secret must remain server-side. Do not expose them through NEXT_PUBLIC environment variables.",
    },
    {
      title: "HTTP-only session cookie",
      description:
        "The application session is stored in an HTTP-only cookie with secure settings in production, SameSite protection, and a seven-day lifetime.",
    },
    {
      title: "Account linking",
      description:
        "An existing local account can be linked to GitHub when its email matches the primary verified GitHub email. The database also enforces uniqueness for provider and provider account ID pairs to prevent one GitHub account from being linked to multiple users.",
    },
    {
      title: "Session revocation",
      description:
        "Logout removes the local session cookie but does not revoke the GitHub access token or invalidate an already-issued JWT elsewhere. The session remains valid until its expiry if a copy of the token has been obtained.",
    },
    {
      title: "Access token handling",
      description:
        "The GitHub access token is used server-side to retrieve the profile and email. This template does not persist the GitHub access token for subsequent API access.",
    },
    {
      title: "Production configuration",
      description:
        "Use HTTPS callback URLs and secure cookie settings in production. Keep OAuth credentials private, configure the exact callback URL in GitHub, and use a strong randomly generated AUTH_SECRET.",
    },
  ],
};
