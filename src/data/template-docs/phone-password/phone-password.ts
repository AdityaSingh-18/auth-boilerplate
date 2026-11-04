import type { TemplateDocumentation } from "@/types/auth";

export const phonePasswordDocumentation: TemplateDocumentation = {
  overview:
    "A headless phone number and password authentication implementation for Next.js App Router. It includes registration, login, logout, session verification, password hashing, E.164 phone number normalization and validation, and a Neon PostgreSQL database adapter, with an optional reference UI.",

  files: [
    {
      path: "README.md",
      description:
        "Explains the template architecture, dependencies, environment configuration, database setup, installation, E.164 phone number requirements, and API usage.",
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
        "Defines the users table, including unique normalized phone numbers, password hashes, and account creation timestamps.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Implements registration, login, current-user retrieval, phone number normalization, password validation, and public user responses.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Implements the AuthDatabase interface using Neon serverless PostgreSQL queries for finding and creating users by phone number.",
      required: true,
    },
    {
      path: "core/lib/phone.ts",
      description:
        "Normalizes and validates international phone numbers using libphonenumber-js and converts them into E.164 format.",
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
        "Creates and verifies signed JWT session tokens and manages the HTTP-only authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/register/route.ts",
      description:
        "Handles account registration, validates phone number and password fields, and returns the newly created public user.",
      required: true,
    },
    {
      path: "core/api/auth/login/route.ts",
      description:
        "Handles phone number and password login and establishes an authenticated session.",
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
        "Provides an optional reference authentication form demonstrating registration, login, session checking, and logout using phone numbers and passwords.",
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
        "Secret used to sign and verify authentication session tokens. Use a strong random secret of at least 32 bytes.",
      required: true,
    },
  ],

  securityNotes: [
    {
      title: "Phone number normalization",
      description:
        "Phone numbers are validated and normalized using libphonenumber-js. The implementation stores phone numbers in E.164 format to maintain consistent database lookups.",
    },
    {
      title: "Phone number ownership",
      description:
        "Phone number validation does not verify ownership. SMS OTP verification is not included, so the implementation does not confirm that a user controls the supplied phone number.",
    },
    {
      title: "Phone number uniqueness",
      description:
        "The database enforces phone number uniqueness through a UNIQUE constraint. Registration handles duplicate phone number conflicts.",
    },
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
        "Add rate limiting, review CSRF and origin protections, implement phone ownership verification where required, validate deployment configuration, and perform a security review before production use.",
    },
  ],
};
