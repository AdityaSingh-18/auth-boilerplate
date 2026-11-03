import type { TemplateDocumentation } from "@/types/auth";

export const emailOtpDocumentation: TemplateDocumentation = {
  overview:
    "A headless passwordless email OTP authentication implementation for Next.js App Router. It includes cryptographically secure OTP generation, HMAC-SHA256 hashing, challenge expiration, verification attempt tracking, email delivery through SMTP, session management, and a Neon PostgreSQL database adapter, with an optional reference UI.",

  files: [
    {
      path: "README.md",
      description:
        "Explains the Email OTP architecture, dependencies, environment configuration, secret generation, SMTP setup, database setup, installation, authentication flow, and API usage.",
      required: true,
    },
    {
      path: ".env.example",
      description:
        "Lists the environment variables required for Neon PostgreSQL, JWT session signing, OTP hashing, and SMTP email delivery.",
      required: true,
    },
    {
      path: "core/db/schema.sql",
      description:
        "Defines the users, email OTP challenges, and email OTP rate-limit tables, including challenge expiration, verification attempts, consumption timestamps, and rate-limit constraints.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Implements email normalization, OTP request and verification flows, per-email rate limiting, user creation, current-user retrieval, and logout.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Implements the database operations for finding and creating users, managing OTP challenges, tracking failed verification attempts, consuming challenges, and enforcing per-email rate limits using Neon PostgreSQL.",
      required: true,
    },
    {
      path: "core/lib/otp.ts",
      description:
        "Generates cryptographically secure six-digit OTPs, hashes them using HMAC-SHA256, verifies submitted OTP hashes using timing-safe comparison, and defines OTP expiration and attempt configuration.",
      required: true,
    },
    {
      path: "core/lib/mailer.ts",
      description:
        "Provides an SMTP email sender using Nodemailer, an EmailSender interface for custom providers, and a helper for constructing and sending OTP emails.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates and verifies signed JWT session tokens using jose and manages the HTTP-only authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/request-otp/route.ts",
      description:
        "Handles OTP requests, validates the email address, invokes the OTP request flow, and returns a generic response to avoid revealing whether an email address has an account.",
      required: true,
    },
    {
      path: "core/api/auth/verify-otp/route.ts",
      description:
        "Validates submitted email and OTP values, verifies the active challenge, creates or retrieves the user, and establishes an authenticated session.",
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
        "Provides an optional reference authentication form demonstrating OTP requests, OTP verification, session checking, authenticated user display, and logout.",
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
      name: "OTP_SECRET",
      description:
        "Separate secret used to generate HMAC-SHA256 hashes of OTP values. Configure a strong random secret containing at least 32 bytes.",
      required: true,
    },
    {
      name: "SMTP_HOST",
      description:
        "Hostname of the SMTP server used to deliver OTP emails, such as smtp.gmail.com.",
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
        "Verified sender email address and optional display name used for outgoing OTP emails.",
      required: true,
    },
  ],

  securityNotes: [
    {
      title: "OTP generation and hashing",
      description:
        "OTP values are generated using Node.js cryptographic random functions and stored as HMAC-SHA256 hashes. The OTP secret must be separate from the JWT authentication secret.",
    },
    {
      title: "OTP expiration and single-use verification",
      description:
        "OTP challenges expire after five minutes. Successfully verified challenges are consumed, preventing their reuse.",
    },
    {
      title: "Verification attempt protection",
      description:
        "Failed OTP verification attempts are tracked, and challenges are no longer eligible for verification after five failed attempts.",
    },
    {
      title: "Rate limiting",
      description:
        "The implementation applies persistent per-email request and verification rate limits. IP-based rate limiting and distributed bot protection are not included.",
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
      title: "Email delivery",
      description:
        "SMTP credentials must remain server-side. A successful OTP request response does not guarantee inbox delivery. Configure SPF, DKIM, and DMARC for production email domains.",
    },
    {
      title: "Additional production protections",
      description:
        "Implement IP-based rate limiting, review CSRF and origin protections, add email delivery failure handling, and perform a security review before production use.",
    },
  ],
};
