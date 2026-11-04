# Magic Link Authentication — Next.js App Router

A passwordless email magic-link authentication boilerplate using Next.js App Router, Neon Postgres, `jose`, and Nodemailer.

## Features

- Passwordless sign-in by email
- Cryptographically random, signed JWT magic-link tokens
- SHA-256 token hashes stored in the database (raw tokens are never stored)
- Short token expiry and atomic single-use consumption
- Per-email request rate limiting
- Pluggable email sender interface with SMTP as the default
- HTTP-only session cookie
- Register/login are combined into one email-link flow

## Requirements

- Node.js runtime
- A Next.js App Router project
- A Neon Postgres database
- An SMTP account/provider

Install dependencies:

```bash
pnpm add @neondatabase/serverless jose nodemailer
pnpm add -D @types/nodemailer
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values.

Generate two different secrets:

```bash
openssl rand -base64 32
```

Run the command twice. Use one value for `AUTH_SECRET` and another for `MAGIC_LINK_SECRET`. Each must contain at least 32 bytes. Never commit real secrets.

SMTP configuration:
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: commonly `587` for STARTTLS or `465` for implicit TLS
- `SMTP_SECURE`: `false` for port 587; `true` for port 465
- `SMTP_USER` and `SMTP_PASS`: SMTP credentials; Gmail generally requires an App Password when 2-Step Verification is enabled
- `EMAIL_FROM`: verified sender address, optionally with a display name

## Database setup

Create a Neon project, open its SQL Editor, and run `core/db/schema.sql`.

Set `DATABASE_URL` to the Neon connection string. Keep the connection string and secrets server-side only.

## Integration

Copy the template's `core` directory into your application's `src` directory, preserving the structure:

```text
src/
  app/api/auth/request-link/route.ts
  app/api/auth/callback/route.ts
  app/api/auth/logout/route.ts
  app/api/auth/me/route.ts
  db/schema.sql
  lib/auth.ts
  lib/auth-db.ts
  lib/magic-link.ts
  lib/mailer.ts
  lib/session.ts
```

The template API files use relative imports for the original `core/api/auth/...` layout. After copying into `src/app/api/auth/...`, update the imports to your project's aliases, for example `@/lib/auth`, `@/lib/mailer`, and `@/lib/session`. The optional UI calls the endpoints listed below.

Render `optional-ui/AuthForm.tsx` from a client component/page, or use it as a reference for your own UI.

## Authentication flow

1. The client submits an email to `POST /api/auth/request-link`.
2. The server normalizes and validates the email, applies a per-email request limit, creates a signed JWT with a random `jti`, hashes the complete token, and stores only that hash with an expiry.
3. The server emails a URL containing the raw signed token.
4. The browser opens `GET /api/auth/callback?token=...`.
5. The callback verifies the JWT signature, issuer, audience, purpose, and expiry; it then atomically consumes the matching token hash.
6. The server finds or creates the user and establishes a session cookie. Reusing the same link fails because the database row has already been consumed.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/request-link` | Request a sign-in link |
| GET | `/api/auth/callback?token=...` | Verify and consume the link, then redirect |
| POST | `/api/auth/logout` | Clear the session cookie |
| GET | `/api/auth/me` | Return the current user |

Request body:

```json
{ "email": "person@example.com" }
```

The request endpoint returns a generic success message to reduce account enumeration. The callback redirects to `/` on success and `/login?error=invalid_or_expired_link` when the link is invalid, expired, or already used.

## Configuration and limitations

- Magic links expire after 15 minutes (`MAGIC_LINK_CONFIG.expirySeconds`).
- Requests are limited to 5 per email per 15 minutes.
- The rate limit is per email, not per IP. Add IP-based throttling at your edge or application layer for production.
- The callback uses a fixed redirect destination to avoid open redirects. Adjust it deliberately if your application needs another destination.
- SMTP delivery must be configured before requesting links.
- If email delivery fails after the token is saved, the token remains active until expiry. A subsequent request creates a new token and invalidates earlier unconsumed tokens for that email.
- The optional UI is a minimal reference implementation, not a complete production account-management experience.
- Add your own CSRF/origin protections, monitoring, abuse controls, and application-specific authorization checks as appropriate.

## Security notes

- Raw magic-link tokens are never persisted.
- Tokens are signed with `MAGIC_LINK_SECRET` and verified with `jose`.
- The full signed token is SHA-256 hashed before database storage.
- Database consumption is conditional and atomic, preventing successful replay.
- Session cookies are HTTP-only, `SameSite=Lax`, and secure in production.
- Use HTTPS in production. Avoid logging callback URLs or token query parameters.
