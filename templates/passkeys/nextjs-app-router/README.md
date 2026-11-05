# Passkeys — Next.js App Router

A WebAuthn/passkey authentication reference implementation using SimpleWebAuthn, Neon Postgres, and signed HTTP-only session cookies.

This template demonstrates passkey registration, discoverable credential authentication, server-side credential verification, and session management.

## Features

- WebAuthn registration and authentication using SimpleWebAuthn
- Discoverable credentials (users do not need to enter an email before signing in)
- Registration restricted to authenticated users
- Server-side challenge generation and verification
- Credential public key and signature counter storage
- Challenge expiration and single-use consumption
- Neon PostgreSQL database integration
- Signed JWT sessions using `jose`
- HTTP-only session cookies
- Optional React passkey UI component

## Requirements

- Next.js with the App Router
- Node.js 20+
- PostgreSQL-compatible database (Neon recommended)
- A browser and device supporting WebAuthn
- HTTPS in production (localhost is permitted for development)

## Installation

Install the required dependencies:

```bash
pnpm add @simplewebauthn/server @simplewebauthn/browser @neondatabase/serverless jose
```

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure the environment variables.

## Environment variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | Neon connection URL |
| `AUTH_SECRET` | Yes | Secret used to sign session JWTs; minimum 32 bytes | Generated secret |
| `APP_URL` | Yes for deployment configuration | Public application URL | `http://localhost:3000` |
| `RP_NAME` | Yes | Human-readable relying party name | `My Application` |
| `RP_ID` | Yes | WebAuthn relying party domain | `localhost` |
| `RP_ORIGIN` | Yes | Exact browser origin | `http://localhost:3000` |

Generate a secure session secret:

```bash
openssl rand -base64 32
```

### WebAuthn domain configuration

For local development:

```env
RP_NAME="My Application"
RP_ID="localhost"
RP_ORIGIN="http://localhost:3000"
```

For production:

```env
RP_NAME="My Application"
RP_ID="example.com"
RP_ORIGIN="https://example.com"
```

Important configuration rules:

- `RP_ID` must be a hostname or parent domain. Do not include a protocol or port.
- `RP_ORIGIN` must be the exact origin used by the browser, including the protocol and port when applicable.
- `RP_ORIGIN` must not contain a URL path.
- The RP ID must match the origin hostname or be one of its parent domains.
- Production deployments must use HTTPS.
- Changing the RP ID can make previously registered credentials unusable on the new domain.

## Database setup

Run the SQL file against your Neon database:

```text
core/db/schema.sql
```

The schema creates:

### `users`

A minimal user table containing:

- `id`
- `email`
- `name`
- `created_at`

### `passkey_credentials`

Stores registered passkey credentials:

- `credential_id`
- `user_id`
- `public_key`
- `counter`
- `transports`
- `device_type`
- `backed_up`
- `created_at`
- `last_used_at`

### `passkey_challenges`

Stores temporary WebAuthn challenges:

- `challenge`
- `user_id`
- `purpose`
- `expires_at`
- `consumed_at`
- `created_at`

**Existing user database:** The included schema provides a minimal users table for demonstration. If your application already has a users table, adapt the SQL and database queries to your existing user model rather than creating a second user system.

## Authentication architecture

This template does not implement account creation or an independent account-management system.

It assumes that your application already has a user account system.

### Passkey registration

1. The user signs in using your existing authentication method.
2. The application requests registration options.
3. The server generates a WebAuthn challenge and stores it with the authenticated user's ID.
4. The browser invokes the WebAuthn registration process.
5. The browser returns the registration response.
6. The server verifies the response, expected challenge, origin, and RP ID.
7. The verified credential's ID, public key, counter, and metadata are stored in the database.

Registration is restricted to an authenticated user so that a passkey is associated with an existing account.

### Passkey authentication

1. The browser requests authentication options.
2. The server generates a challenge and stores it temporarily.
3. The browser invokes the WebAuthn authentication process.
4. The authenticator returns a signed assertion.
5. The server finds the stored credential using its credential ID.
6. SimpleWebAuthn verifies the assertion, expected challenge, origin, and RP ID.
7. The challenge is consumed, the credential counter is updated, and a session is created for the associated user.

This implementation uses discoverable credentials, so users do not need to enter their email address or username before authentication.

## API reference

All endpoints are implemented as Next.js route handlers.

### Registration

**1. Generate registration options**

```http
POST /api/auth/passkeys/register/options
```

Requires an authenticated user session.

Returns the WebAuthn registration options generated for that user.

**2. Verify registration**

```http
POST /api/auth/passkeys/register/verify
Content-Type: application/json
```

Request body: WebAuthn registration response returned by the browser.

The server verifies the response and stores the credential.

### Authentication

**3. Generate authentication options**

```http
POST /api/auth/passkeys/authenticate/options
```

Does not require an existing session.

Returns discoverable-credential authentication options.

**4. Verify authentication**

```http
POST /api/auth/passkeys/authenticate/verify
Content-Type: application/json
```

Request body: WebAuthn authentication assertion returned by the browser.

On successful verification, the server creates an authenticated session.

### Session management

**5. Get current user**

```http
GET /api/auth/me
```

Returns the current user:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Example User"
  }
}
```

When no valid session exists:

```json
{
  "user": null
}
```

**6. Logout**

```http
POST /api/auth/logout
```

Clears the session cookie.

## Optional UI component

The template includes:

```text
optional-ui/PasskeyAuth.tsx
```

It exports a React client component with:

- Passkey registration
- Passkey sign-in
- Loading states
- Basic error messages

Example:

```tsx
import { PasskeyAuth } from "@/components/PasskeyAuth";

export default function PasskeyPage() {
  return (
    <main>
      <h1>Passkey authentication</h1>
      <PasskeyAuth allowRegistration />
    </main>
  );
}
```

Only enable `allowRegistration` on pages accessible to authenticated users.

The component uses `@simplewebauthn/browser` to invoke the browser's native WebAuthn APIs.

## Session management

After successful authentication, the server creates a signed JWT using `jose`.

Session configuration:

| Setting | Value |
|---|---|
| Cookie name | `auth_session` |
| Signing algorithm | HS256 |
| Session lifetime | 7 days |
| HTTP-only | Enabled |
| SameSite | Lax |
| Secure | Enabled in production |
| Cookie path | `/` |

The session stores the authenticated user's ID as the JWT subject.

## Security considerations

This implementation includes several important security measures:

- Cryptographically generated WebAuthn challenges.
- Five-minute challenge expiration.
- Single-use challenge consumption using a conditional database update.
- Server-side verification of registration and authentication responses.
- Expected origin and RP ID validation.
- Credential public key storage.
- Signature counter tracking.
- HTTP-only session cookies.
- Secure cookies in production.
- Registration restricted to authenticated users.

### Production hardening

Before deploying this implementation in production, consider adding:

1. **Rate limiting:** Protect registration and authentication endpoints against abuse.
2. **CSRF and origin protection:** Validate request origins on state-changing endpoints.
3. **Account recovery:** Provide a secure recovery process for users who lose their passkeys.
4. **Credential management:** Allow users to view and remove registered passkeys.
5. **User verification policy:** The example uses preferred user verification. Set `userVerification` to `required` and `requireUserVerification` to `true` if your security policy requires it.
6. **Monitoring:** Record authentication failures and suspicious activity without logging sensitive credential material.
7. **Database consistency:** Challenge consumption, credential persistence, counter updates, and session creation are separate operations in this reference implementation. Consider transactional handling where appropriate.
8. **Credential counter handling:** Synced passkeys can have different counter behavior. Do not treat every unchanged counter as definitive proof of an attack without considering the authenticator and deployment context.

This template does not implement account recovery, email verification, credential removal, or a complete account-management system.

## Troubleshooting

### Passkey registration fails

Check that:

- The application is running on the configured RP origin.
- The RP ID matches the domain.
- The user has a valid authenticated session.
- The database schema has been applied.
- The browser supports WebAuthn.

### Passkey authentication fails

Check that:

- The credential exists in the database.
- The challenge has not expired or already been consumed.
- The RP ID and origin have not changed.
- The application is using HTTPS in production.
- The stored public key and credential ID have not been modified.

### WebAuthn origin or RP ID errors

Verify the following:

```env
RP_ID="example.com"
RP_ORIGIN="https://example.com"
```

Do not put `https://` or a port in `RP_ID`.

## File structure

```text
templates/passkeys/nextjs-app-router/
├── .env.example
├── README.md
├── core/
│   ├── api/
│   │   └── auth/
│   │       ├── passkeys/
│   │       │   ├── register/
│   │       │   │   ├── options/route.ts
│   │       │   │   └── verify/route.ts
│   │       │   └── authenticate/
│   │       │       ├── options/route.ts
│   │       │       └── verify/route.ts
│   │       ├── logout/route.ts
│   │       └── me/route.ts
│   ├── db/
│   │   └── schema.sql
│   └── lib/
│       ├── auth.ts
│       ├── auth-db.ts
│       ├── passkey.ts
│       ├── passkey-challenge.ts
│       └── session.ts
└── optional-ui/
    └── PasskeyAuth.tsx
```

## Next.js integration

The template keeps its implementation files under `core/` to make the source easy to explore and download.

Next.js does not automatically discover route handlers inside `core/api`.

When integrating the template into your application:

1. Move the route handlers into your Next.js App Router API directory.
2. Place the library files inside your preferred server-side library directory.
3. Update relative imports or configure your project's path aliases.
4. Adapt database queries to your existing user schema.
5. Configure the environment variables.
6. Apply the database schema.
7. Integrate the optional UI component into your application.

For a project using the `src/` directory, route handlers typically belong under:

```text
src/app/api/
```

For a project without the `src/` directory:

```text
app/api/
```

Review all import paths after moving the files.

---

**Note:** This is a reference implementation intended to be adapted to your application's architecture. Review the code, configure your domain and database correctly, and perform security and integration testing before production use.