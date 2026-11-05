# X (Twitter) OAuth 2.0 Authentication Boilerplate

A reusable X (formerly Twitter) OAuth 2.0 authentication implementation for Next.js App Router applications.

This boilerplate uses **OAuth 2.0 Authorization Code Flow with PKCE (S256)** to authenticate users through their X accounts.

## Features

- OAuth 2.0 Authorization Code Flow
- PKCE using the S256 code challenge method
- Random OAuth state generation and validation
- X access token exchange
- Authenticated user profile lookup
- Neon PostgreSQL user and OAuth account storage
- JWT-based sessions using `jose`
- HTTP-only session cookies
- Login, logout, and current-user API routes
- Optional React authentication button

## Requirements

- Node.js 20 or later
- Next.js App Router
- TypeScript
- Neon PostgreSQL database
- X Developer account and an application with OAuth 2.0 enabled

## Installation

Install the required dependencies:

```bash
pnpm add @neondatabase/serverless jose
```

The implementation uses Node.js built-in modules and Next.js APIs. No additional OAuth client library is required.

## Project Structure

```text
nextjs-app-router/
├── .env.example
├── README.md
├── core/
│   ├── api/
│   │   └── auth/
│   │       ├── x/
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
│       ├── oauth-state.ts
│       ├── session.ts
│       └── x-oauth.ts
└── optional-ui/
    └── AuthButton.tsx
```

## 1. Configure an X Developer Application

1. Open the [X Developer Portal](https://developer.x.com/).
2. Create or select a project and application.
3. Enable OAuth 2.0 authentication for the application.
4. Select a web application or the appropriate confidential client type for your deployment.
5. Configure the callback URL to match your application's redirect URI.
6. Enable the required user authentication permissions.
7. Copy the OAuth 2.0 Client ID and Client Secret.

Configure the callback URL exactly as:

```text
https://your-domain.com/api/auth/x/callback
```

For local development, register the corresponding localhost callback URL in the developer portal.

The callback URL registered with X must exactly match `X_REDIRECT_URI`.

## 2. Environment Variables

Copy `.env.example` into your application's `.env.local`:

```env
DATABASE_URL="your_neon_database_connection_string"

AUTH_SECRET="replace_with_a_random_secret_at_least_32_bytes_long"

X_CLIENT_ID="your_x_oauth2_client_id"
X_CLIENT_SECRET="your_x_oauth2_client_secret"
X_REDIRECT_URI="http://localhost:3000/api/auth/x/callback"

APP_URL="http://localhost:3000"
```

### Environment variable reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Secret used to sign JWT sessions; minimum 32 bytes |
| `X_CLIENT_ID` | X OAuth 2.0 Client ID |
| `X_CLIENT_SECRET` | X OAuth 2.0 Client Secret |
| `X_REDIRECT_URI` | Registered OAuth callback URL |
| `APP_URL` | Base URL of your application |

Generate a strong session secret:

```bash
openssl rand -base64 32
```

Never commit `.env.local` or expose the X Client Secret to browser code.

## 3. Move the Template Files

Copy the contents of `core/` into the corresponding locations in your Next.js application.

For example:

```text
core/api/auth/x/route.ts
    → src/app/api/auth/x/route.ts

core/api/auth/x/callback/route.ts
    → src/app/api/auth/x/callback/route.ts

core/api/auth/logout/route.ts
    → src/app/api/auth/logout/route.ts

core/api/auth/me/route.ts
    → src/app/api/auth/me/route.ts

core/db/schema.sql
    → database setup script

core/lib/
    → src/lib/
```

Update relative imports if you change the folder structure.

## 4. Database Setup

This implementation uses Neon PostgreSQL.

Open the Neon SQL Editor and execute:

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

### Database design

**users**

Stores application user information.

- `id`: Internal UUID
- `email`: Nullable email address
- `name`: Display name
- `image_url`: Profile image URL
- `email_verified`: Email verification status
- `created_at`: Account creation time
- `updated_at`: Last update time

**oauth_accounts**

Stores external OAuth account relationships.

- `id`: OAuth account record UUID
- `user_id`: Associated application user
- `provider`: OAuth provider identifier (`x`)
- `provider_account_id`: Stable X user ID
- `created_at`: Account linking time

The unique provider/account constraint prevents the same X account from being linked to multiple application users.

## 5. Authentication Flow

The implementation follows this sequence:

1. The user visits `/api/auth/x`.
2. The server generates a random OAuth state and PKCE code verifier.
3. The server derives the S256 code challenge.
4. State and verifier are stored in HTTP-only cookies.
5. The user is redirected to X's authorization page.
6. X redirects the user to `/api/auth/x/callback`.
7. The callback validates the returned state.
8. The server exchanges the authorization code and PKCE verifier for an access token.
9. The server requests the authenticated user's profile from X.
10. The database adapter finds or creates the application user and links the X account.
11. A signed JWT session is created and stored in an HTTP-only cookie.

### OAuth endpoints used

Authorization:

```text
https://x.com/i/oauth2/authorize
```

Token exchange:

```text
https://api.x.com/2/oauth2/token
```

Authenticated user lookup:

```text
https://api.x.com/2/users/me
```

The profile request uses the `users.read` scope and requests:

```text
id,name,username,profile_image_url
```

## 6. API Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/x` | Starts X OAuth authentication |
| GET | `/api/auth/x/callback` | Handles the OAuth callback |
| POST | `/api/auth/logout` | Clears the session cookie |
| GET | `/api/auth/me` | Returns the current authenticated user |

### Current user response

Authenticated:

```json
{
  "user": {
    "id": "user-uuid",
    "email": null,
    "name": "Example User",
    "imageUrl": "https://example.com/profile.jpg",
    "emailVerified": false
  }
}
```

Unauthenticated:

```json
{
  "user": null
}
```

The unauthenticated response uses HTTP status `401`.

## 7. Optional Authentication UI

The template includes:

```text
optional-ui/AuthButton.tsx
```

Copy this component into your application and import it where you want to display the X sign-in button.

```tsx
import { AuthButton } from "@/components/AuthButton";

export default function LoginPage() {
  return (
    <main>
      <h1>Sign in</h1>
      <AuthButton />
    </main>
  );
}
```

Adjust the import path to match where you place the component.

The component checks the current session, displays the authenticated user's profile, and provides sign-in and sign-out actions.

## 8. Session Management

Sessions use JWTs signed with HS256 through `jose`.

Session configuration:

| Setting | Value |
|---|---|
| Cookie name | `auth_session` |
| Algorithm | HS256 |
| Session duration | 7 days |
| HTTP-only | Enabled |
| Secure | Enabled in production |
| SameSite | Lax |
| Path | `/` |

The JWT includes the internal user ID as its subject and validates the issuer and audience when reading the session.

## 9. Security Considerations

- PKCE uses SHA-256 (`S256`) to protect the authorization code exchange.
- OAuth state is generated randomly and validated during the callback.
- State and PKCE verifier cookies are HTTP-only.
- OAuth cookies expire after 10 minutes.
- Session cookies are HTTP-only and Secure in production.
- The X Client Secret is used only on the server.
- Access tokens are not returned to the browser or stored in the database.
- Existing email accounts are not automatically linked to X accounts.
- X account relationships use the stable provider user ID rather than a username.

## 10. Limitations

- The implementation uses the X `users.read` scope and does not request email access.
- User email is stored as `null` because the profile endpoint used here does not provide it.
- Email ownership and verification are not implemented.
- Refresh tokens are not persisted, and automatic access-token refresh is not implemented.
- Logout clears the browser's session cookie but does not revoke an already-issued JWT.
- User creation and OAuth account linking are separate database operations and are not transactional.
- No IP-based rate limiting is included.
- X API access and rate limits depend on the application's developer access level and permissions.
- The optional UI is a basic reference component, not a complete authentication interface.

## Production Checklist

Before deploying:

- [ ] Configure the production callback URL in the X Developer Portal.
- [ ] Set production environment variables.
- [ ] Use a strong `AUTH_SECRET`.
- [ ] Execute the database schema.
- [ ] Verify OAuth 2.0 permissions and application access.
- [ ] Test sign-in, callback validation, and logout.
- [ ] Review rate limiting and account-linking requirements.
- [ ] Add appropriate error handling and monitoring.
- [ ] Review the implementation before using it in production.

---

**This boilerplate is a reference implementation.** Review and adapt it to your application's security, database, and deployment requirements.