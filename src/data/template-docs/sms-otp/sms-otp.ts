import type { TemplateDocumentation } from "@/types/auth";

export const smsOtpDocumentation: TemplateDocumentation = {
  overview:
    "A headless passwordless phone authentication implementation for Next.js App Router. It includes cryptographically generated six-digit OTPs, HMAC-SHA-256 OTP hashing, expiration and single-use verification, per-phone rate limiting, pluggable console, Twilio, and Vonage SMS providers, session management, and a Neon PostgreSQL database adapter, with an optional reference UI.",

  files: [
    {
      path: "README.md",
      description:
        "Explains the SMS OTP architecture, dependencies, environment configuration, SMS provider setup, database setup, installation, authentication flow, API usage, and security considerations.",
      required: true,
    },
    {
      path: ".env.example",
      description:
        "Lists the environment variables required for Neon PostgreSQL, session signing, OTP hashing, and the supported SMS providers.",
      required: true,
    },
    {
      path: "core/db/schema.sql",
      description:
        "Defines the users, SMS OTP challenges, and SMS OTP rate-limit tables, including OTP hashes, expiration timestamps, attempt counts, and consumption timestamps.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Implements phone normalization, E.164-style phone validation, OTP request and verification flows, per-phone rate limiting, user creation, current-user retrieval, and session establishment.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Implements Neon database operations for finding and creating users, creating and invalidating OTP challenges, finding active challenges, updating verification attempts, consuming OTP challenges, and enforcing per-phone rate limits.",
      required: true,
    },
    {
      path: "core/lib/otp.ts",
      description:
        "Generates cryptographically secure six-digit OTPs, hashes them using HMAC-SHA-256, verifies submitted codes using constant-time comparison, and defines OTP expiration and rate-limit configuration.",
      required: true,
    },
    {
      path: "core/lib/sms.ts",
      description:
        "Provides a common SmsSender interface and pluggable console, Twilio, and Vonage SMS provider implementations.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates and verifies signed JWT authentication sessions using jose and manages the HTTP-only authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/request-otp/route.ts",
      description:
        "Handles OTP requests, validates the supplied phone number, applies request rate limiting, and sends the verification code through the configured SMS provider.",
      required: true,
    },
    {
      path: "core/api/auth/verify-otp/route.ts",
      description:
        "Validates the submitted phone number and OTP, applies verification rate limiting, consumes the OTP challenge, and establishes an authenticated session.",
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
        "Provides an optional reference authentication form demonstrating phone-number submission, OTP requests, OTP verification, session checking, authenticated user display, and logout.",
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
        "Separate secret used for HMAC-SHA-256 OTP hashing. Configure a strong random secret containing at least 32 bytes.",
      required: true,
    },
    {
      name: "SMS_PROVIDER",
      description:
        'Selects the SMS provider: "console", "twilio", or "vonage".',
      required: true,
    },
    {
      name: "TWILIO_ACCOUNT_SID",
      description:
        "Twilio account SID. Required when SMS_PROVIDER is set to twilio.",
      required: false,
    },
    {
      name: "TWILIO_AUTH_TOKEN",
      description:
        "Twilio authentication token. Required when SMS_PROVIDER is set to twilio.",
      required: false,
    },
    {
      name: "TWILIO_PHONE_NUMBER",
      description:
        "Twilio sender phone number. Required when SMS_PROVIDER is set to twilio.",
      required: false,
    },
    {
      name: "VONAGE_API_KEY",
      description:
        "Vonage API key. Required when SMS_PROVIDER is set to vonage.",
      required: false,
    },
    {
      name: "VONAGE_API_SECRET",
      description:
        "Vonage API secret. Required when SMS_PROVIDER is set to vonage.",
      required: false,
    },
    {
      name: "VONAGE_BRAND_NAME",
      description:
        "Vonage SMS sender ID. Required when SMS_PROVIDER is set to vonage.",
      required: false,
    },
  ],

  securityNotes: [
    {
      title: "Cryptographically secure OTP generation",
      description:
        "Six-digit OTPs are generated using Node.js cryptographic random number generation rather than ordinary pseudo-random functions.",
    },
    {
      title: "OTP hashing and storage",
      description:
        "OTP values are HMAC-SHA-256 hashed using a dedicated OTP_SECRET before database storage. Plaintext OTP values are not persisted in the database.",
    },
    {
      title: "OTP expiration and single-use verification",
      description:
        "OTP challenges expire after five minutes. Successful verification consumes the challenge using a conditional database update to prevent reuse.",
    },
    {
      title: "Verification attempts",
      description:
        "Each OTP challenge allows a maximum of five verification attempts. Further verification attempts against an exhausted challenge are rejected.",
    },
    {
      title: "Rate limiting",
      description:
        "OTP requests are limited to five per phone number per 15 minutes, and verification attempts are limited to five per phone number per five minutes. IP-based rate limiting and distributed bot protection are not included. Failed SMS delivery still consumes the request rate-limit allowance.",
    },
    {
      title: "Phone number validation",
      description:
        "The implementation checks E.164-style phone number formatting but does not verify phone ownership, assignment, or reachability.",
    },
    {
      title: "SMS provider security",
      description:
        "SMS provider credentials must remain server-side. The console provider logs OTP values and should only be used for local development. A successful provider API response does not guarantee handset delivery.",
    },
    {
      title: "Session cookie protection",
      description:
        "Authentication sessions use signed JWTs stored in HTTP-only cookies with SameSite=Lax and Secure enabled in production. The session duration is seven days.",
    },
    {
      title: "Session revocation",
      description:
        "Logout clears the browser cookie, but an already-issued session JWT remains valid until expiration if copied. Add server-side revocation if immediate invalidation is required.",
    },
    {
      title: "Additional production protections",
      description:
        "Implement IP/device-based rate limiting, abuse monitoring, SMS spending limits, and phone ownership verification before production use. Follow applicable SMS consent and sender registration requirements.",
    },
  ],
};
