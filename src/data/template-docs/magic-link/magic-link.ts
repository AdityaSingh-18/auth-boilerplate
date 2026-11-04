import type { TemplateDocumentation } from "@/types/auth";

export const magicLinkDocumentation: TemplateDocumentation = {
  overview:
    "A headless passwordless magic-link authentication implementation for Next.js App Router. It includes signed single-use token generation, SHA-256 token hashing, token expiration and consumption, per-email rate limiting, email delivery through SMTP, session management, and a Neon PostgreSQL database adapter, with an optional reference UI.",

  files: [
    {
      path: "README.md",
      description:
        "Explains the Magic Link architecture, dependencies, environment configuration, secret generation, SMTP setup, database setup, installation, authentication flow, and API usage.",
      required: true,
    },
    {
      path: ".env.example",
      description:
        "Lists the environment variables required for Neon PostgreSQL, JWT session signing, magic-link token signing, application URL configuration, and SMTP email delivery.",
      required: true,
    },
    {
      path: "core/db/schema.sql",
      description:
        "Defines the users, magic-link tokens, and magic-link rate-limit tables, including token expiration, token hashes, consumption timestamps, and rate-limit constraints.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Implements email normalization, magic-link request and callback verification flows, per-email rate limiting, user creation, current-user retrieval, and authentication session management.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Implements the database operations for finding and creating users, creating and consuming magic-link tokens, invalidating previous unconsumed links, and enforcing per-email rate limits using Neon PostgreSQL.",
      required: true,
    },
    {
      path: "core/lib/magic-link.ts",
      description:
        "Creates and verifies signed magic-link tokens, generates SHA-256 hashes of complete signed tokens for database storage, and defines token expiration and verification configuration.",
      required: true,
    },
    {
      path: "core/lib/mailer.ts",
      description:
        "Provides an SMTP email sender using Nodemailer, an EmailSender interface for custom providers, and a helper for constructing and sending magic-link emails.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates and verifies signed JWT session tokens using jose and manages the HTTP-only authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/request-link/route.ts",
      description:
        "Handles magic-link requests, validates the email address, invokes the magic-link request flow, applies rate limiting, and returns a generic response to avoid revealing account information.",
      required: true,
    },
    {
      path: "core/api/auth/callback/route.ts",
      description:
        "Verifies the signed magic-link token, checks its expiration and stored hash, consumes the token once, creates or retrieves the user, establishes an authenticated session, and redirects the browser.",
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
        "Provides an optional reference authentication form demonstrating magic-link requests, session checking, authenticated user display, and logout.",
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
        "Secret used to sign and verify authentication session tokens. Configure a strong random secret containing at least 32 bytes.",
      required: true,
    },
    {
      name: "MAGIC_LINK_SECRET",
      description:
        "Separate secret used to sign and verify magic-link tokens. Configure a strong random secret containing at least 32 bytes.",
      required: true,
    },
    {
      name: "APP_URL",
      description:
        "Base URL of the application used to construct magic-link callback URLs, such as http://localhost:3000.",
      required: true,
    },
    {
      name: "SMTP_HOST",
      description:
        "Hostname of the SMTP server used to deliver magic-link emails, such as smtp.gmail.com.",
      required: true,
    },
    {
      name: "SMTP_PORT",
      description:
        "SMTP server port. Common values are 587 for STARTTLS and 465 for implicit TLS.",
      required: true,
    },
    {
      name: "SMTP_SECURE",
      description:
        "Controls implicit TLS for the SMTP connection. Set to true for port 465 and false for port 587.",
      required: true,
    },
    {
      name: "SMTP_USER",
      description:
        "Username or email address used to authenticate with the SMTP server.",
      required: true,
    },
    {
      name: "SMTP_PASS",
      description:
        "Password or provider-specific credential used to authenticate with the SMTP server. For Gmail, use an App Password instead of your regular account password.",
      required: true,
    },
    {
      name: "EMAIL_FROM",
      description:
        "Verified sender email address and optional display name used for outgoing magic-link emails.",
      required: true,
    },
  ],

  securityNotes: [
    {
      title: "Signed magic-link tokens",
      description:
        "Magic-link tokens are signed using a dedicated MAGIC_LINK_SECRET rather than the JWT authentication session secret. Keep both secrets separate and configure strong random values containing at least 32 bytes.",
    },
    {
      title: "Token hashing and storage",
      description:
        "The complete signed magic-link token is hashed using SHA-256 before database storage. The raw token is not persisted in the database.",
    },
    {
      title: "Token expiration and single-use verification",
      description:
        "Magic-link tokens expire after 15 minutes. Successful token consumption uses a conditional database update to prevent the same token from being used more than once.",
    },
    {
      title: "Previous link invalidation",
      description:
        "Requesting a new magic link consumes previously issued unconsumed links for the same email address, so older links cannot be used after a new request.",
    },
    {
      title: "Rate limiting",
      description:
        "The implementation applies persistent per-email rate limiting to magic-link requests. IP-based rate limiting and distributed bot protection are not included.",
    },
    {
      title: "Session cookie protection",
      description:
        "The session cookie uses HTTP-only, SameSite=Lax, and Secure in production settings, with a seven-day expiry. Review your deployment and HTTPS configuration before production use.",
    },
    {
      title: "Session revocation",
      description:
        "Logout clears the browser cookie, but already-issued session tokens remain valid until expiration. Add server-side revocation if immediate invalidation is required.",
    },
    {
      title: "Callback URL exposure",
      description:
        "The signed magic-link token is included in the callback URL query string. Avoid logging full callback URLs and consider email security scanners that may automatically visit links before users open them.",
    },
    {
      title: "Email delivery",
      description:
        "SMTP credentials must remain server-side. A successful magic-link request response does not guarantee inbox delivery. Configure SPF, DKIM, and DMARC for production email domains.",
    },
    {
      title: "Additional production protections",
      description:
        "Implement IP-based rate limiting, review callback and origin protections, add email delivery failure handling, and perform a security review before production use.",
    },
  ],
};
