# Email OTP Authentication

A reusable passwordless email authentication implementation for Next.js App Router, using Neon PostgreSQL, Nodemailer, and JWT-based sessions.

This template implements its own OTP generation, hashing, storage, verification, user creation, and session management. Neon provides database hosting, while Nodemailer handles email delivery through SMTP.

## Features

- Passwordless email authentication
- Cryptographically secure six-digit OTP generation
- HMAC-SHA256 OTP hashing
- Configurable OTP expiration
- Single-use OTP challenges
- Failed OTP verification attempt tracking
- Per-email request and verification rate limits
- Neon PostgreSQL database adapter
- SMTP email delivery using Nodemailer
- Pluggable email sender interface
- Stateless JWT sessions using `jose`
- HTTP-only session cookies
- Request OTP, verify OTP, logout, and current-user API routes
- Optional reference authentication form
- Separated core authentication logic and optional UI

## Tech Stack

- Next.js App Router
- TypeScript
- Neon PostgreSQL
- `@neondatabase/serverless`
- `nodemailer`
- `jose`
- Node.js Crypto

## Requirements

- Node.js 20 or later
- A Next.js App Router project
- A Neon PostgreSQL account
- An SMTP account or email delivery provider

Install the required packages:

```bash
pnpm add @neondatabase/serverless jose nodemailer
pnpm add -D @types/nodemailer
```

## Environment Variables

Copy `.env.example` to `.env.local` in your Next.js project root.

Configure the following variables:

```env
DATABASE_URL="your_neon_database_connection_string"

AUTH_SECRET="replace_with_a_random_secret_at_least_32_bytes_long"
OTP_SECRET="replace_with_a_different_random_secret_at_least_32_bytes_long"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-email-app-password"
EMAIL_FROM="Your App <your-email@gmail.com>"
```

### Generate Authentication Secrets

Both `AUTH_SECRET` and `OTP_SECRET` must be configured with separate random secrets containing at least 32 bytes.

Generate a random secret using:

```bash
openssl rand -base64 32
```

Run this command twice:

1. Use the first generated value for `AUTH_SECRET`.
2. Use the second generated value for `OTP_SECRET`.

**Important:**
- Generate separate values for both secrets.
- Do not use the same secret for JWT signing and OTP hashing.
- Never commit real secrets or `.env.local` to version control.
- Keep these values private and do not expose them in client-side code.

## Email Delivery Setup

This template uses Nodemailer to send OTP emails through an SMTP provider.

### Gmail SMTP Configuration

For Gmail, use the following settings:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-google-app-password"
EMAIL_FROM="Your App <your-email@gmail.com>"
```

Gmail requires an App Password rather than your regular Google account password.

To generate a Google App Password:

1. Open your Google Account settings.
2. Enable 2-Step Verification.
3. Visit https://myaccount.google.com/apppasswords.
4. Generate an App Password.
5. Copy the generated password into `SMTP_PASS`.

Some Google Workspace accounts may restrict App Password usage.

### Other SMTP Providers

You can also use another SMTP provider by updating the SMTP environment variables.

The default SMTP configuration supports:

- Port `587` with `SMTP_SECURE="false"` for STARTTLS.
- Port `465` with `SMTP_SECURE="true"` for implicit TLS.

Follow your provider's SMTP configuration requirements.

### Custom Email Provider

The mailer is separated from the authentication logic through an `EmailSender` interface.

You can implement a custom sender to integrate providers such as Resend, SendGrid, or AWS SES without changing the OTP generation and verification logic.

## Database Setup

This implementation uses Neon PostgreSQL as its database provider.

### 1. Create a Neon Project

1. Visit https://neon.tech/.
2. Create an account or sign in.
3. Create a new PostgreSQL project.
4. Open the project dashboard.

### 2. Configure the Database Connection

Copy the PostgreSQL connection string from your Neon dashboard.

Add it to `.env.local` as `DATABASE_URL`.

### 3. Apply the Database Schema

The schema is located at:

```text
core/db/schema.sql
```

To initialize your database:

1. Open the Neon SQL Editor.
2. Copy the complete contents of `core/db/schema.sql`.
3. Paste the SQL into the editor.
4. Execute the SQL.
5. Verify that all three tables have been created.

The schema creates:

| Table | Purpose |
|---|---|
| `users` | Stores authenticated users |
| `email_otp_challenges` | Stores hashed OTP challenges |
| `email_otp_rate_limits` | Stores per-email rate-limit counters |

The schema also creates the required indexes and constraints.

**Important:** Execute the database schema before using the authentication API routes.

No additional Neon Auth configuration or authentication dashboard settings are required. OTP generation, verification, and email delivery are handled by this template.

## Installation

### 1. Copy the Authentication Core

Copy the contents of `core/lib/` into your Next.js project's `src/lib/` directory.

Keep the internal file structure intact:

```text
src/lib/
├── auth.ts
├── auth-db.ts
├── otp.ts
├── mailer.ts
└── session.ts
```

### 2. Add the API Routes

Copy the route directories from `core/api/auth/` into your project's App Router API directory.

For a project using `src/`:

```text
src/app/api/auth/
├── request-otp/
│   └── route.ts
├── verify-otp/
│   └── route.ts
├── logout/
│   └── route.ts
└── me/
    └── route.ts
```

For a project without `src/`, use `app/api/auth/` instead.

**Important:** Update the relative imports in the copied route files to point to the location where you placed the authentication library.

For example:

```ts
import { requestEmailOtp } from "@/lib/auth";
```

### 3. Configure Neon and SMTP

Make sure you have:

- Configured `DATABASE_URL`.
- Executed `core/db/schema.sql` in Neon.
- Generated separate `AUTH_SECRET` and `OTP_SECRET` values.
- Configured your SMTP credentials.
- Created `.env.local` with the required environment variables.

### 4. Add the Optional UI

Optionally copy:

```text
optional-ui/AuthForm.tsx
```

into your project's components directory.

The UI is a reference implementation. You can build your own interface using the API endpoints.

## Authentication Flow

### Request OTP

1. The user submits an email address.
2. The application normalizes and validates the email address.
3. The per-email request rate limit is checked.
4. A cryptographically secure six-digit OTP is generated.
5. The OTP is hashed using HMAC-SHA256 and `OTP_SECRET`.
6. The hashed challenge is stored in Neon.
7. Previous unconsumed challenges for that email are invalidated.
8. The OTP is sent through the configured SMTP provider.

Raw OTP values are not stored in the database.

### Verify OTP

1. The user submits their email address and OTP.
2. The application validates the submitted values.
3. The verification rate limit is checked.
4. The active OTP challenge is retrieved.
5. The submitted OTP is hashed and compared with the stored hash.
6. Failed attempts are tracked.
7. A successful OTP challenge is consumed.
8. The user is retrieved or created in the database.
9. A JWT session is generated.
10. The session is stored in an HTTP-only cookie.

### Session Management

Sessions are managed using `jose`.

The default configuration includes:

- Seven-day session expiration
- HTTP-only session cookies
- `SameSite=Lax`
- `Secure` enabled in production
- JWT issuer and audience validation

Logout clears the browser's session cookie.

**Note:** Clearing the cookie does not revoke an already-issued JWT. A copied token remains valid until expiration unless an additional revocation mechanism is implemented.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/request-otp` | Request an email verification code |
| POST | `/api/auth/verify-otp` | Verify OTP and create a session |
| POST | `/api/auth/logout` | Log out the current user |
| GET | `/api/auth/me` | Get the current authenticated user |

### Request OTP

**POST** `/api/auth/request-otp`

Request:

```json
{
  "email": "user@example.com"
}
```

Successful response:

```json
{
  "message": "If the address can receive a verification code, an email will be sent."
}
```

### Verify OTP

**POST** `/api/auth/verify-otp`

Request:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Successful response:

```json
{
  "message": "Successfully authenticated.",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

Successful verification also sets the session cookie.

### Logout

Send a POST request to:

```text
/api/auth/logout
```

Successful response:

```json
{
  "message": "Successfully logged out."
}
```

### Current User

Send a GET request to:

```text
/api/auth/me
```

Successful response:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

Unauthenticated requests receive `401 Unauthorized`.

## OTP Configuration

The default OTP settings are defined in:

```text
core/lib/otp.ts
```

| Setting | Default |
|---|---:|
| OTP length | 6 digits |
| OTP expiration | 5 minutes |
| Resend cooldown constant | 60 seconds |
| Maximum failed attempts per OTP | 5 |

The authentication logic also defines:

| Rate Limit | Default |
|---|---:|
| OTP requests per email | 5 |
| Request window | 15 minutes |
| Verification requests per email | 5 |
| Verification window | 5 minutes |

**Implementation note:** The 60-second resend cooldown is defined as a configuration constant but is not independently enforced by the current request flow. The rate limits are per email address, not IP-based.

## Database Integration

The database adapter is located at:

```text
core/lib/auth-db.ts
```

It handles:

- Finding users by email
- Finding users by ID
- Creating users
- Creating OTP challenges
- Finding active OTP challenges
- Tracking failed verification attempts
- Consuming OTP challenges
- Tracking per-email rate limits

The database adapter keeps database operations separate from authentication logic, making it possible to add other database integrations without rewriting the core authentication functions.

## Optional UI

The `optional-ui/` directory contains a reference authentication form supporting:

- Email address entry
- OTP request
- OTP verification
- Existing session checking
- Authenticated user display
- Logout

The UI is optional and is not required for the authentication backend to work.

## Security Notes

- OTPs are generated using Node.js cryptographic random functions.
- OTP values are stored as HMAC-SHA256 hashes.
- OTP hashing and JWT signing use separate secrets.
- OTP verification uses timing-safe hash comparison.
- OTP challenges have an expiration time.
- Successfully verified challenges are consumed.
- Failed verification attempts are tracked.
- Per-email request and verification rate limits are implemented.
- JWT sessions are stored in HTTP-only cookies.
- Database queries use parameterized Neon SQL templates.
- Real credentials must never be committed to version control.

### Production Considerations

Before using this template with real users, consider implementing:

- IP-based rate limiting
- Distributed rate limiting for multiple application instances
- CAPTCHA or bot protection
- CSRF and request-origin protections
- Authentication event monitoring
- Expired OTP and rate-limit record cleanup
- Email delivery retry and failure handling
- Session revocation if immediate invalidation is required
- Email ownership and account recovery workflows

Email delivery depends on the configured SMTP provider. A successful API response does not guarantee inbox delivery.

For custom sending domains, configure SPF, DKIM, and DMARC.

## License

Use and modify this boilerplate according to the license of the project distributing it.
