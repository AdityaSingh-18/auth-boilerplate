import type { TemplateDocumentation } from "@/types/auth";

export const emailPasswordDocumentation: TemplateDocumentation = {
  overview:
    "A headless email and password authentication implementation for Next.js App Router. It includes registration, login, logout, session verification, password hashing, and a Neon PostgreSQL database adapter, with an optional reference UI.",

  files: [
    {
      path: "README.md",
      description:
        "Explains the template architecture, dependencies, environment configuration, database setup, installation, and API usage.",
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
        "Defines the users table, including unique email addresses, password hashes, and account creation timestamps.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Implements registration, login, current-user retrieval, email normalization, input validation, and public user responses.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Implements the AuthDatabase interface using Neon serverless PostgreSQL queries for finding and creating users.",
      required: true,
    },
    {
      path: "core/lib/password.ts",
      description:
        "Hashes passwords using PBKDF2 with SHA-256 and verifies stored password hashes.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates and verifies signed session tokens and manages the HTTP-only authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/register/route.ts",
      description:
        "Handles account registration, validates request fields, and returns the newly created public user.",
      required: true,
    },
    {
      path: "core/api/auth/login/route.ts",
      description:
        "Handles email and password login and establishes an authenticated session.",
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
        "Verifies the current session and returns the authenticated user's public information.",
      required: true,
    },
    {
      path: "optional-ui/AuthForm.tsx",
      description:
        "Provides an optional reference authentication form demonstrating registration, login, session checking, and logout.",
      required: false,
    },
  ],

  functions: [],

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
        "Secret used to sign and verify authentication session tokens. Use a strong random secret of at least 32 characters.",
      required: true,
    },
  ],

  securityNotes: [
    {
      title: "Password security",
      description:
        "Passwords are hashed using PBKDF2 with SHA-256 and a unique random salt. Plain-text passwords are not stored in the database.",
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
      title: "Additional production protections",
      description:
        "Add rate limiting, review CSRF and origin protections, validate deployment configuration, and perform a security review before production use.",
    },
  ],
};
