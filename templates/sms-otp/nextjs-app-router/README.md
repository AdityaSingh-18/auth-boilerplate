# SMS OTP Authentication — Next.js App Router

A reusable phone-number authentication boilerplate using six-digit SMS OTPs, Neon Postgres, and pluggable SMS providers.

> This is downloadable template source code, not a hosted authentication service. Review and adapt it before production use.

## Features

- Six-digit cryptographically generated OTPs
- HMAC-SHA-256 OTP hashing
- Five-minute OTP expiration
- Maximum five verification attempts per challenge
- Per-phone-number request and verification rate limits
- Pluggable console, Twilio, and Vonage SMS providers
- One-time OTP consumption
- JWT-based authentication sessions
- HTTP-only session cookies
- Request OTP, verify OTP, logout, and current-user endpoints
- Optional reference UI

## Tech Stack

- Next.js App Router
- TypeScript
- Neon Serverless Postgres
- `@neondatabase/serverless`
- `jose`
- Node.js built-in `crypto`
- Built-in `fetch` for SMS provider APIs

## Requirements

- Node.js 20+
- A Neon Postgres database
- An SMS provider account for real SMS delivery

The console provider can be used for local development without an SMS provider account.

## Installation

Install the dependencies:

```bash
pnpm add @neondatabase/serverless jose
```

## Database Setup

1. Create a Neon project.
2. Open the Neon SQL Editor.
3. Copy the contents of `core/db/schema.sql`.
4. Execute the SQL.
5. Copy the database connection string.

The schema creates:

- `users`
- `sms_otp_challenges`
- `sms_otp_rate_limits`

## Environment Variables

Copy `.env.example` to `.env.local`.

### Database and authentication

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon database connection string |
| `AUTH_SECRET` | Secret used to sign session JWTs |
| `OTP_SECRET` | Separate secret used to hash OTP values |

Generate strong secrets:

```bash
openssl rand -base64 32
```

Run the command twice and use different values for `AUTH_SECRET` and `OTP_SECRET`.

Both secrets must contain at least 32 bytes.

### SMS provider

Select a provider using:

```env
SMS_PROVIDER="console"
```

Supported providers:

- `console`
- `twilio`
- `vonage`

### Console provider

The console provider prints the OTP to the server terminal.

Use it for local development only.

### Twilio provider

Set:

```env
SMS_PROVIDER="twilio"
```

Configure:

```env
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

The sender number must be configured for SMS delivery in your Twilio account.

### Vonage provider

Set:

```env
SMS_PROVIDER="vonage"
```

Configure:

```env
VONAGE_API_KEY=""
VONAGE_API_SECRET=""
VONAGE_BRAND_NAME=""
```

The sender ID must comply with Vonage and destination-country requirements.

Some countries require sender registration or a dedicated number.

## Project Structure

```text
sms-otp/nextjs-app-router/
├── README.md
├── .env.example
├── core/
│   ├── api/
│   │   └── auth/
│   │       ├── request-otp/
│   │       │   └── route.ts
│   │       ├── verify-otp/
│   │       │   └── route.ts
│   │       ├── logout/
│   │       │   └── route.ts
│   │       └── me/
│   │           └── route.ts
│   ├── db/
│   │   └── schema.sql
│   └── lib/
│       ├── auth.ts
│       ├── auth-db.ts
│       ├── otp.ts
│       ├── sms.ts
│       └── session.ts
└── optional-ui/
    └── AuthForm.tsx
```

## Integration

Copy the API route folders into:

```text
src/app/api/auth/
```

For example:

```text
core/api/auth/request-otp/route.ts
→ src/app/api/auth/request-otp/route.ts
```

Repeat for `verify-otp`, `logout`, and `me`.

Copy the contents of `core/lib/` into your application's library directory.

Update relative imports to match your destination structure. The template uses relative imports based on its original folder layout.

The optional UI can be copied into your application and imported wherever you want to display the authentication form.

## Phone Number Format

Phone numbers must be supplied in E.164 format.

Example:

```text
+14155552671
```

The included validation checks the E.164-style format. It does not verify whether the phone number is assigned, reachable, or capable of receiving SMS.

## Authentication Flow

1. The client submits a phone number to `POST /api/auth/request-otp`.
2. The server normalizes and validates the phone number.
3. The request rate limit is checked.
4. A six-digit OTP is generated using Node.js cryptographic randomness.
5. The OTP is HMAC-hashed using `OTP_SECRET`.
6. The database stores the hash, expiry, and attempt count.
7. The configured SMS provider sends the OTP.
8. The client submits the phone number and OTP to `POST /api/auth/verify-otp`.
9. The server checks the verification rate limit and verifies the OTP.
10. The OTP challenge is atomically consumed.
11. The user is found or created.
12. An authenticated session cookie is established.

## API Endpoints

### Request OTP

**POST `/api/auth/request-otp`**

Request:

```json
{
  "phone": "+14155552671"
}
```

Response:

```json
{
  "message": "If the request is valid, a verification code will be sent."
}
```

### Verify OTP

**POST `/api/auth/verify-otp`**

Request:

```json
{
  "phone": "+14155552671",
  "otp": "123456"
}
```

Response:

```json
{
  "user": {
    "id": "user-id",
    "phone": "+14155552671"
  }
}
```

### Logout

**POST `/api/auth/logout`**

Response:

```json
{
  "message": "Logged out successfully."
}
```

### Current User

**GET `/api/auth/me`**

Authenticated response:

```json
{
  "user": {
    "id": "user-id",
    "phone": "+14155552671"
  }
}
```

Unauthenticated requests receive a `401` response.

## OTP Configuration

The default configuration is defined in `core/lib/otp.ts`.

| Setting | Default |
|---|---:|
| OTP length | 6 digits |
| OTP expiry | 5 minutes |
| Maximum attempts per challenge | 5 |
| Request limit | 5 per 15 minutes |
| Verification limit | 5 per 5 minutes |

If SMS delivery fails, the request still counts toward the phone number's request rate limit.
Rate limits are enforced per phone number.

The template does not include IP-based rate limiting.

## Security Notes

- Use separate secrets for session signing and OTP hashing.
- Never expose database or SMS provider credentials to client-side code.
- OTP values are not stored in plaintext.
- OTP comparisons use constant-time hash comparison.
- OTP challenges are consumed using conditional database updates.
- Session cookies are HTTP-only and secure in production.
- Clearing a session cookie does not revoke a copied JWT. It remains valid until expiry.
- The template does not implement phone-number change verification or account recovery.
- Add IP/device rate limits and abuse monitoring before production deployment.
- Configure provider spending limits to reduce SMS pumping and abuse.
- Follow applicable SMS consent, sender registration, and country-specific messaging requirements.
- SMS delivery can be delayed or filtered. A successful provider API response does not guarantee handset delivery.
- The console provider logs OTPs and must only be used for local development.

## Local Development

1. Configure `.env.local`.
2. Set `SMS_PROVIDER=console`.
3. Apply the database schema.
4. Start your Next.js application.
5. Submit an E.164 phone number.
6. Read the OTP from the server terminal.
7. Submit the OTP to verify the session.

## Deployment Checklist

- [ ] Configure `DATABASE_URL`.
- [ ] Generate distinct `AUTH_SECRET` and `OTP_SECRET` values.
- [ ] Apply the database schema.
- [ ] Configure a production SMS provider.
- [ ] Verify provider credentials and sender configuration.
- [ ] Set `SMS_PROVIDER` correctly.
- [ ] Enable HTTPS.
- [ ] Add IP/device rate limiting and abuse monitoring.
- [ ] Review SMS consent and sender requirements.
- [ ] Test OTP expiration and invalid-code behavior.
- [ ] Test rate limiting and one-time OTP consumption.
