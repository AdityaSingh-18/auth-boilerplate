import type { TemplateDocumentation } from "@/types/auth";

export const guestLoginDocumentation: TemplateDocumentation = {
  overview:
    "A guest authentication implementation for Next.js App Router. It creates temporary guest accounts, establishes authenticated sessions, retrieves the current user, supports logout, and provides a server-side helper for promoting guest accounts by linking verified external identities. It uses Neon PostgreSQL and includes an optional reference UI.",

  files: [
    {
      path: "README.md",
      description:
        "Explains the guest authentication architecture, installation, environment configuration, database setup, API endpoints, guest account lifecycle, identity promotion, session behavior, and security considerations.",
      required: true,
    },
    {
      path: ".env.example",
      description:
        "Lists the environment variables required to connect to Neon PostgreSQL and sign authentication session tokens.",
      required: true,
    },
    {
      path: "core/db/schema.sql",
      description:
        "Defines the users table, external auth_identities table, and constraints that prevent the same provider identity from being linked to multiple users.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Implements Neon PostgreSQL database operations for creating guest users, retrieving users and linked identities, and promoting guest accounts by linking verified identities.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Implements guest session creation, current-user retrieval, and promotion of the currently authenticated guest account while preserving its user ID.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates and verifies signed JWT session tokens and manages the HTTP-only authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/guest/route.ts",
      description:
        "Creates a guest account and establishes a session, reusing an existing valid user session when available.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Verifies the current session and returns the authenticated user's public information.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description:
        "Clears the authentication session cookie and logs out the current browser session.",
      required: true,
    },
    {
      path: "optional-ui/GuestLoginButton.tsx",
      description:
        "Provides an optional reference component for starting a guest session, checking the current user, displaying account status, refreshing the session, and logging out.",
      required: false,
    },
  ],

  functions: [
    {
      name: "createGuestUser",
      description:
        "Creates a new guest user record in the database.",
      signature: "() => Promise<AuthUser>",
    },
    {
      name: "getUserById",
      description:
        "Retrieves a user by their application user ID.",
      signature: "(userId: string) => Promise<AuthUser | null>",
    },
    {
      name: "getIdentityByProviderAccount",
      description:
        "Finds an external identity using its provider and provider account ID.",
      signature:
        "(provider: string, providerAccountId: string) => Promise<AuthIdentity | null>",
    },
    {
      name: "promoteGuestAccount",
      description:
        "Links a previously verified external identity to a guest account and changes the account to a permanent account without changing its user ID.",
      signature:
        "(userId: string, identity: VerifiedIdentity) => Promise<AuthUser>",
    },
    {
      name: "startGuestSession",
      description:
        "Creates a guest user and starts a session. If a valid session already exists, it returns the existing user.",
      signature: "() => Promise<AuthUser>",
    },
    {
      name: "getCurrentUser",
      description:
        "Retrieves the user associated with the current authenticated session.",
      signature: "() => Promise<AuthUser | null>",
    },
    {
      name: "promoteCurrentGuestAccount",
      description:
        "Promotes the currently authenticated guest account by linking an identity that has already been verified by a trusted server-side authentication flow.",
      signature:
        "(identity: VerifiedIdentity) => Promise<AuthUser>",
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
        "Secret used to sign and verify authentication session tokens. Use a strong random secret containing at least 32 bytes.",
      required: true,
    },
  ],

  securityNotes: [
    {
      title: "Verified identity requirement",
      description:
        "Account promotion must only receive identities verified through a trusted server-side authentication flow. Never trust provider account IDs, email addresses, or email verification flags submitted directly by the browser.",
    },
    {
      title: "Identity uniqueness",
      description:
        "The database enforces uniqueness for provider and provider account ID combinations. An identity already linked to another user cannot be linked to the current guest account.",
    },
    {
      title: "Guest account promotion",
      description:
        "Promotion preserves the original guest user ID and changes is_guest to false. Application data associated with that user ID can therefore remain associated with the promoted account.",
    },
    {
      title: "No automatic email-based account merging",
      description:
        "The implementation does not automatically merge accounts based on matching email addresses. Identity linking uses the provider and its stable account ID.",
    },
    {
      title: "Session cookie protection",
      description:
        "The session cookie uses HTTP-only, SameSite=Lax, and Secure in production settings. Review HTTPS and deployment configuration before production use.",
    },
    {
      title: "Session revocation",
      description:
        "Logout clears the browser cookie, but an already-issued JWT may remain valid until expiration. Add server-side session revocation if immediate invalidation is required.",
    },
    {
      title: "Additional production protections",
      description:
        "Protect account-linking operations with appropriate CSRF and origin protections. Add rate limiting, abuse prevention, and a guest account retention policy before production use.",
    },
  ],
};
