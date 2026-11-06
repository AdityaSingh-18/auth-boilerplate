# OIDC Single Sign-On — Next.js App Router

A reusable OpenID Connect (OIDC) Single Sign-On implementation for Next.js App Router applications.

This boilerplate supports organization-based authentication using configured OIDC identity providers. Users enter their work email address, the application identifies the organization from its email domain, and redirects them to the corresponding identity provider.

## Features

- Dynamic OpenID Connect discovery through `.well-known/openid-configuration`
- Administrator-configured email-domain-to-issuer mapping
- Authorization Code flow
- PKCE with S256
- Cryptographically random state and nonce validation
- ID token signature verification using the provider's JWKS
- ID token issuer, audience, expiration, nonce, and email verification checks
- Neon PostgreSQL user and identity storage
- Identity lookup using the `(issuer, subject)` pair
- Application-owned JWT sessions
- HTTP-only session cookies
- Optional sign-in UI component
- Logout and current-user endpoints

## Tech stack

- Next.js App Router
- TypeScript
- Neon PostgreSQL
- `@neondatabase/serverless`
- `jose`
- Node.js cryptographic utilities

## Project structure

```text
nextjs-app-router/
├── .env.example
├── README.md
├── core/
│   ├── db/
│   │   └── schema.sql
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── auth-db.ts
│   │   ├── oidc-discovery.ts
│   │   ├── oidc-state.ts
│   │   ├── oidc.ts
│   │   └── session.ts
│   └── api/
│       └── auth/
│           ├── oidc/
│           │   ├── start/
│           │   │   └── route.ts
│           │   └── callback/
│           │       └── route.ts
│           ├── logout/
│           │   └── route.ts
│           └── me/
│               └── route.ts
└── optional-ui/
    └── OidcSignIn.tsx
```

## Requirements

- Node.js 20 or newer
- A Next.js App Router application
- A Neon PostgreSQL database
- An OIDC identity provider
- An OIDC client registration supported by the configured providers
- HTTPS in production

## 1. Install dependencies

Install the required packages in your Next.js application:

```bash
pnpm add @neondatabase/serverless jose
```

The `server-only` package is used to prevent server-side authentication modules from being imported into client components. If it is not already available in your application, install it:

```bash
pnpm add server-only
```

## 2. Configure environment variables

Copy `.env.example` into your application as `.env.local`.

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

AUTH_SECRET="replace-with-a-random-secret-at-least-32-bytes-long"

OIDC_CLIENT_ID="your-oidc-client-id"
OIDC_CLIENT_SECRET="your-oidc-client-secret"

OIDC_REDIRECT_URI="http://localhost:3000/api/auth/oidc/callback"

APP_URL="http://localhost:3000"
```

### Environment variable reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Secret used to sign application session JWTs; at least 32 bytes |
| `OIDC_CLIENT_ID` | OIDC application client ID |
| `OIDC_CLIENT_SECRET` | OIDC application client secret |
| `OIDC_REDIRECT_URI` | Registered OIDC callback URL |
| `APP_URL` | Public base URL of the application |

Generate a session secret:

```bash
openssl rand -base64 32
```

The redirect URI must exactly match the URI registered with the identity provider.

For production, use your HTTPS application domain and store credentials in your deployment platform's secret manager.

**Important:** This implementation uses one shared OIDC client registration for all configured tenants. Each provider must support that registration. Providers requiring different client credentials need a tenant-specific credential-management extension.

## 3. Configure the OIDC provider

Register an OIDC application with your identity provider.

Configure the following:

- Application type: Web application
- Grant type: Authorization Code
- Client authentication: `client_secret_basic`
- PKCE method: S256
- Scopes: `openid`, `profile`, `email`
- Redirect URI: the exact value of `OIDC_REDIRECT_URI`

The provider must support:

- An OpenID Connect discovery document
- An HTTPS authorization endpoint
- An HTTPS token endpoint
- An HTTPS JWKS endpoint
- RS256 ID token signatures
- Verified email claims

The implementation validates the ID token using the provider's discovered JWKS.

## 4. Set up the database

Run the SQL schema against your Neon PostgreSQL database.

File:

```text
core/db/schema.sql
```

The schema creates three tables:

### `users`

Stores application users.

| Column | Description |
|---|---|
| `id` | User UUID |
| `email` | Verified email address |
| `name` | Optional display name |
| `image_url` | Optional profile image |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

### `oidc_tenants`

Stores administrator-configured organization mappings.

| Column | Description |
|---|---|
| `id` | Tenant UUID |
| `domain` | Normalized email domain |
| `issuer` | Exact OIDC issuer identifier |
| `enabled` | Whether the tenant is enabled |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

### `oidc_accounts`

Stores external OIDC identities linked to application users.

| Column | Description |
|---|---|
| `id` | Identity record UUID |
| `user_id` | Associated application user |
| `issuer` | OIDC issuer |
| `subject` | Provider subject identifier |
| `email` | Verified provider email |
| `email_verified` | Email verification status |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

The unique `(issuer, subject)` constraint prevents the same OIDC identity from being registered more than once.

## 5. Register organization tenants

Tenant mappings are managed by application administrators. They must not be created from user-supplied issuer URLs.

For example:

```sql
INSERT INTO oidc_tenants (domain, issuer)
VALUES (
  'example.com',
  'https://identity.example.com'
);
```

The issuer must exactly match the `issuer` claim in the provider's discovery document.

To disable a tenant:

```sql
UPDATE oidc_tenants
SET enabled = FALSE,
    updated_at = NOW()
WHERE domain = 'example.com';
```

To enable it again:

```sql
UPDATE oidc_tenants
SET enabled = TRUE,
    updated_at = NOW()
WHERE domain = 'example.com';
```

Only enabled tenant mappings are accepted during sign-in.

## 6. Integrate the template into Next.js

The files under `core/api` are organized as reusable template source files. Next.js does not automatically discover routes in this directory.

Copy the library files into your application's server-side library directory:

```text
src/lib/auth/oidc/
```

Copy the API route files into the Next.js App Router:

```text
src/app/api/auth/oidc/start/route.ts
src/app/api/auth/oidc/callback/route.ts
src/app/api/auth/logout/route.ts
src/app/api/auth/me/route.ts
```

Update relative imports after moving the files. Alternatively, use your application's configured `@/` alias.

Copy the optional UI component into:

```text
src/components/auth/OidcSignIn.tsx
```

The component calls the API endpoints using their `/api/auth/...` paths.

### Login page example

```tsx
import OidcSignIn from "@/components/auth/OidcSignIn";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <OidcSignIn />
    </main>
  );
}
```

The callback redirects to `/login` after successful authentication. Adjust the redirect destination in the callback route if your application uses a different login or dashboard route.

## 7. Authentication flow

1. The user enters their work email address.
2. The application extracts and normalizes the email domain.
3. The domain is matched against an enabled `oidc_tenants` record.
4. The application retrieves the provider's OIDC discovery document.
5. It generates a random state, nonce, and PKCE verifier/challenge.
6. Temporary HTTP-only cookies store the flow values and selected tenant ID.
7. The browser is redirected to the provider's authorization endpoint.
8. The provider authenticates the user and redirects to the callback URL.
9. The callback validates the state value.
10. The application exchanges the authorization code using PKCE.
11. The ID token signature is checked against the provider's JWKS.
12. The application validates the issuer, audience, expiry, nonce, issued-at time, and verified email claim.
13. The authenticated email domain is checked against the selected tenant.
14. The `(issuer, subject)` identity is retrieved or registered in the database.
15. An application session JWT is issued in an HTTP-only cookie.
16. Temporary OIDC flow cookies are cleared.

## 8. API endpoints

### Start OIDC sign-in

`POST /api/auth/oidc/start`

Request:

```json
{
  "email": "user@example.com"
}
```

Successful response:

```json
{
  "success": true,
  "authorizationUrl": "https://identity.example.com/authorize?..."
}
```

The response contains the provider authorization URL. The browser must navigate to this URL.

### OIDC callback

`GET /api/auth/oidc/callback?code=...&state=...`

The identity provider redirects the browser to this endpoint after authentication.

The callback:

- Validates state and temporary cookies.
- Exchanges the authorization code.
- Validates the ID token.
- Resolves the user identity.
- Creates the application session.
- Redirects to `/login`.

On failure, it redirects to `/login` with an error query parameter.

### Get current user

`GET /api/auth/me`

Successful response:

```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "Example User",
    "imageUrl": null,
    "createdAt": "2026-01-01T10:00:00.000Z"
  }
}
```

Unauthenticated response:

```json
{
  "success": false,
  "error": "Not authenticated"
}
```

### Logout

`POST /api/auth/logout`

Successful response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

Logout clears the application session cookie.

## 9. Session management

The application creates its own signed JWT after successful OIDC authentication.

Session configuration:

- Algorithm: HS256
- Cookie: `auth_session`
- Duration: 7 days
- HTTP-only: enabled
- SameSite: Lax
- Secure: enabled in production
- Path: `/`
- Issuer: `oidc-sso-auth`
- Audience: `oidc-sso-app`

The application session is independent of the provider's ID token.

Deleting the session cookie does not revoke an already copied JWT. The token remains cryptographically valid until expiration unless additional server-side revocation is implemented.

## 10. Security considerations

### Issuer restrictions

Issuer URLs are administrator-configured in the database. Users cannot submit arbitrary issuer URLs.

The implementation requires HTTPS and checks that the discovery document's issuer exactly matches the configured issuer.

Production deployments should additionally restrict outbound network access to approved identity-provider destinations and protect against access to private or internal network addresses.

### State and nonce validation

State protects the authorization callback against cross-site request forgery. Nonce binds the ID token to the authentication request.

Both values are generated using Node.js cryptographic randomness and stored in temporary HTTP-only cookies.

### PKCE

The authorization flow uses PKCE with the S256 challenge method to protect authorization codes.

### ID token validation

The implementation verifies:

- RS256 signature using the provider's JWKS
- Exact issuer
- Client audience
- Expiration
- Issued-at time
- Nonce
- Verified email claim

### Email verification

Only providers returning `email_verified: true` are accepted.

The authenticated email domain must match the tenant selected before redirecting to the provider.

### Account linking

OIDC identities are keyed by `(issuer, subject)`.

The implementation does not automatically link an identity to an existing application account based only on a matching email address. A separate, authenticated account-linking flow should be implemented if that functionality is required.

### Cookies

Temporary flow cookies and application session cookies are HTTP-only and use `SameSite=Lax`.

Secure cookies are enabled in production.

### Additional production protections

Before production deployment, consider adding:

- IP-based rate limiting
- Login attempt monitoring
- Structured audit logging
- Server-side session revocation
- Tenant administration authorization
- Tenant-specific client credentials where needed
- Explicit outbound network allowlisting
- A dedicated account-linking workflow

## 11. Limitations

This is a reusable reference implementation, not a complete enterprise identity-management platform.

Current limitations include:

- One shared OIDC client registration for all tenants.
- Only RS256 ID token signatures are supported.
- Only verified email identities are accepted.
- No automatic account linking by email.
- No tenant administration interface.
- No server-side session revocation.
- No IP-based rate limiting.
- No provider-specific logout or single logout implementation.
- No automatic user provisioning or deprovisioning synchronization.
- No support for encrypted ID tokens.
- No refresh-token lifecycle management.
- No tenant-specific role or group synchronization.

Provider compatibility should be verified against the actual discovery metadata and token behavior before enabling a tenant.

## 12. Production checklist

- [ ] Configure a production Neon database.
- [ ] Run `core/db/schema.sql`.
- [ ] Configure a strong `AUTH_SECRET`.
- [ ] Register the OIDC application with the identity provider.
- [ ] Configure the exact HTTPS redirect URI.
- [ ] Set all environment variables.
- [ ] Register and verify each organization tenant.
- [ ] Move API routes into the Next.js App Router.
- [ ] Update imports after moving files.
- [ ] Configure the login page and callback destination.
- [ ] Verify state, nonce, PKCE, issuer, audience, and email checks.
- [ ] Test successful and failed sign-in flows.
- [ ] Add production rate limiting and monitoring.
- [ ] Review provider-specific security and compliance requirements.

---

**This boilerplate provides a foundation for organization-based OIDC Single Sign-On in Next.js applications.**