# Facebook OAuth Authentication — Next.js App Router

A reusable Facebook OAuth 2.0 authentication boilerplate for Next.js App Router applications.

This implementation uses Facebook Login, authorization-code exchange, OAuth state validation, Facebook Graph API profile retrieval, Neon PostgreSQL for user and OAuth account storage, and JWT-based sessions.

## Features

- Facebook OAuth 2.0 authorization-code flow
- Random OAuth state generation and validation
- Facebook access-token validation through the Graph API
- Facebook profile retrieval using the Graph API
- Optional email and profile image retrieval
- Neon PostgreSQL user and OAuth account storage
- Protection against automatically linking accounts by email
- HTTP-only JWT session cookies
- Session verification and logout endpoints
- Optional Facebook sign-in UI component

## Project Structure

```text
nextjs-app-router/
├── .env.example
├── README.md
├── core/
│   ├── api/
│   │   └── auth/
│   │       ├── facebook/
│   │       │   ├── route.ts
│   │       │   └── callback/
│   │       │       └── route.ts
│   │       ├── logout/
│   │       │   └── route.ts
│   │       └── me/
│   │           └── route.ts
│   ├── db/
│   │   └── schema.sql
│   └── lib/
│       ├── auth.ts
│       ├── auth-db.ts
│       ├── facebook-oauth.ts
│       ├── oauth-state.ts
│       └── session.ts
└── optional-ui/
    └── AuthButton.tsx
```

## Requirements

- Node.js compatible with your Next.js version
- Next.js App Router
- A Neon PostgreSQL database
- A Meta developer account
- A Facebook app configured for Facebook Login

## Installation

Install the required dependencies:

```bash
pnpm add @neondatabase/serverless jose
```

Copy the boilerplate files into your Next.js project.

The API route files belong under your application's `src/app/api` directory (or `app/api` if your project does not use `src/`).

The library files belong under `src/lib` (or `lib`).

For example:

```text
src/
├── app/
│   └── api/
│       └── auth/
│           ├── facebook/
│           │   ├── route.ts
│           │   └── callback/
│           │       └── route.ts
│           ├── logout/
│           │   └── route.ts
│           └── me/
│               └── route.ts
└── lib/
    ├── auth.ts
    ├── auth-db.ts
    ├── facebook-oauth.ts
    ├── oauth-state.ts
    └── session.ts
```

**Important:** Update relative imports when moving the files into your application. The template's `core/api` and `core/lib` structure is intended to be adapted to your project's directory layout.

## 1. Configure a Meta App

1. Open the [Meta for Developers](https://developers.facebook.com/) website.
2. Sign in with your developer account.
3. Create a new app.
4. Add and configure the Facebook Login product available for your app.
5. Configure the appropriate website platform and application domain.
6. Add your OAuth callback URL to the valid OAuth redirect URI settings.
7. Copy your App ID and App Secret from the app dashboard.

Your callback URL must match the configured redirect URI exactly.

For local development, use:

```text
http://localhost:3000/api/auth/facebook/callback
```

For production, use your deployed HTTPS domain.

Meta may require additional app configuration, permissions, privacy-policy information, or app review before external users can use your integration.

## 2. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
DATABASE_URL="your_neon_database_connection_string"

AUTH_SECRET="your_random_secret_at_least_32_bytes_long"

FACEBOOK_APP_ID="your_meta_app_id"
FACEBOOK_APP_SECRET="your_meta_app_secret"
FACEBOOK_REDIRECT_URI="http://localhost:3000/api/auth/facebook/callback"
FACEBOOK_GRAPH_API_VERSION="v26.0"

APP_URL="http://localhost:3000"
```

### Environment variable reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Secret used to sign session JWTs |
| `FACEBOOK_APP_ID` | Meta application ID |
| `FACEBOOK_APP_SECRET` | Meta application secret |
| `FACEBOOK_REDIRECT_URI` | Registered Facebook OAuth callback URL |
| `FACEBOOK_GRAPH_API_VERSION` | Facebook Graph API version |
| `APP_URL` | Base URL of your application |

Generate a secure session secret:

```bash
openssl rand -base64 32
```

Keep the Facebook App Secret and `AUTH_SECRET` private. Never expose them through client-side environment variables or commit real credentials to source control.

Use a Graph API version supported by your Meta app and update it as part of your maintenance process.

## 3. Database Setup

This boilerplate uses Neon PostgreSQL.

Open your Neon SQL Editor and execute:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  name TEXT,
  image_url TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users (LOWER(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS oauth_accounts_user_id_idx
  ON oauth_accounts(user_id);
```

### Database tables

**users**

Stores application user records.

**oauth_accounts**

Stores the relationship between application users and external OAuth accounts.

The combination of `provider` and `provider_account_id` is unique, preventing the same Facebook account from being linked to multiple users.

## 4. Authentication Flow

1. The user visits `/api/auth/facebook`.
2. The application generates a cryptographically random OAuth state value.
3. The state is stored in an HTTP-only cookie.
4. The user is redirected to Facebook's authorization page.
5. Facebook redirects the user to the callback URL with an authorization code and state.
6. The application validates the returned state against the stored cookie.
7. The authorization code is exchanged for a Facebook access token.
8. The access token is validated using Facebook's token-debugging endpoint.
9. The application retrieves the user's Facebook profile.
10. The application finds or creates the corresponding user and links the Facebook account.
11. A signed JWT session is created and stored in an HTTP-only cookie.
12. The user is redirected to the application home page.

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/facebook` | Starts Facebook OAuth |
| GET | `/api/auth/facebook/callback` | Handles the Facebook callback |
| POST | `/api/auth/logout` | Clears the session cookie |
| GET | `/api/auth/me` | Returns the current authenticated user |

### Start Facebook sign-in

Navigate the browser to:

```text
/api/auth/facebook
```

This endpoint generates the OAuth state and redirects the browser to Facebook.

### Facebook callback

Facebook redirects to:

```text
/api/auth/facebook/callback
```

The callback validates the OAuth state, exchanges the authorization code, retrieves the profile, and creates the application session.

### Get the current user

```http
GET /api/auth/me
```

Authenticated response:

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "Example User",
    "image_url": "https://example.com/profile.jpg",
    "email_verified": false
  }
}
```

Unauthenticated response:

```json
{
  "user": null
}
```

The unauthenticated response uses HTTP status `401`.

### Sign out

```http
POST /api/auth/logout
```

Response:

```json
{
  "success": true,
  "message": "Signed out successfully."
}
```

Logout clears the browser's session cookie.

## 6. Optional UI Integration

The `optional-ui/AuthButton.tsx` component provides a basic Facebook sign-in and sign-out interface.

Import it into a client component or page:

```tsx
import AuthButton from "@/components/AuthButton";

export default function LoginPage() {
  return (
    <main>
      <h1>Sign in</h1>
      <AuthButton />
    </main>
  );
}
```

Copy the component into your application's component directory and adjust the import path as needed.

The component expects the authentication API endpoints to be available at the paths documented above.

## 7. Security Considerations

### OAuth state validation

The application generates a cryptographically random state value and validates it during the callback to protect against OAuth CSRF attacks.

### Access-token validation

The application validates the Facebook access token through the Graph API token-debugging endpoint and checks that it belongs to the configured Meta app.

### App secret proof

The application generates an `appsecret_proof` value for Graph API profile requests using HMAC-SHA256 and the Facebook App Secret.

### Session security

Session JWTs are signed using HS256 and stored in HTTP-only cookies.

Cookie settings include:

- `httpOnly: true`
- `secure: true` in production
- `sameSite: "lax"`
- `path: "/"`

The session lifetime is seven days.

### Account linking

The implementation does not automatically link a Facebook account to an existing application user based on email.

If an existing user has the same email, the sign-in flow asks the user to authenticate using their existing method before implementing an account-linking flow.

### Email verification

The implementation does not treat the Facebook Graph API email field as independently verified.

The application stores `email_verified` as `false`, even when Facebook returns an email address.

### Access-token storage

The Facebook access token is used to retrieve the profile and is not stored in the application session or database.

## 8. Limitations

- Facebook email is optional and may not be returned.
- Email ownership verification is not implemented.
- Account linking to an existing user is not implemented.
- Account creation and OAuth account linking are separate database operations, not one atomic transaction.
- No access-token persistence or long-lived token management is implemented.
- No global Facebook logout or JWT revocation mechanism is implemented.
- The session cookie is removed on logout, but an already issued JWT remains valid until expiration if copied elsewhere.
- Rate limiting and login-attempt monitoring are not included.
- Facebook app permissions, review requirements, and availability depend on Meta's current platform configuration.

## 9. Production Checklist

Before deploying:

- [ ] Configure the production Meta app.
- [ ] Register the exact production callback URL.
- [ ] Configure the production application domain.
- [ ] Set all environment variables securely.
- [ ] Use HTTPS.
- [ ] Run the database schema.
- [ ] Confirm the selected Graph API version is supported.
- [ ] Review Meta permissions and app-review requirements.
- [ ] Add rate limiting and monitoring.
- [ ] Review account-linking and recovery requirements.
- [ ] Test successful login, cancellation, invalid state, and logout.

---

**This is a reference implementation.** Review and adapt the authentication flow, database operations, and security controls before using it in a production application.
