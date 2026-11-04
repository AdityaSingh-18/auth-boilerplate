# GitHub OAuth Authentication

A GitHub OAuth 2.0 authentication boilerplate for Next.js App Router.

This template allows users to sign in with their GitHub accounts. It handles the OAuth authorization flow, retrieves the user's primary verified email, links GitHub accounts to existing users, and creates an application session using a secure HTTP-only cookie.

## Features

- GitHub OAuth 2.0 authorization flow
- Cryptographically secure OAuth state generation and validation
- Authorization code exchange for an access token
- GitHub user profile retrieval
- Primary verified email retrieval
- Automatic account linking using verified email addresses
- Neon PostgreSQL database integration
- JWT-based session authentication using `jose`
- Secure HTTP-only session cookies
- Login, logout, and current-user endpoints

## Requirements

- Node.js 20 or later
- Next.js App Router
- Neon PostgreSQL database
- GitHub account

## Installation

Install the required dependencies:

```bash
pnpm add @neondatabase/serverless jose
```

## GitHub OAuth App Setup

First, create a GitHub OAuth App.

1. Open [GitHub Developer Settings](https://github.com/settings/developers).
2. Navigate to **OAuth Apps**.
3. Click **New OAuth App**.
4. Enter the following application details:

| Field | Local development value |
|---|---|
| Application name | Your application name |
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/github/callback` |

5. Click **Register application**.
6. Copy the generated **Client ID**.
7. Generate a **Client Secret** and copy it.

Keep your Client Secret private. Never expose it in client-side code or commit it to version control.

For production, update the Homepage URL and callback URL to use your deployed application's HTTPS domain.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure the environment variables:

```env
DATABASE_URL="your_neon_database_connection_string"

AUTH_SECRET="your_random_secret_at_least_32_bytes_long"

GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"
GITHUB_REDIRECT_URI="http://localhost:3000/api/auth/github/callback"

APP_URL="http://localhost:3000"
```

Generate a secure authentication secret:

```bash
openssl rand -base64 32
```

Make sure `GITHUB_REDIRECT_URI` exactly matches the callback URL configured in your GitHub OAuth App.

For production, configure these variables using your hosting provider's environment variable settings.

## Database Setup

This template uses Neon PostgreSQL.

Execute the SQL statements in:

`core/db/schema.sql`

The schema creates two tables.

### users

Stores application user information:

- `id`
- `email`
- `name`
- `image_url`
- `email_verified`
- `created_at`
- `updated_at`

A unique index on the lowercase email address prevents duplicate accounts with different email casing.

### oauth_accounts

Stores OAuth provider account associations:

- `id`
- `user_id`
- `provider`
- `provider_account_id`
- `created_at`

A unique constraint on the provider and provider account ID prevents the same GitHub account from being linked to multiple application users.

## Project Structure

```text
nextjs-app-router/
├── .env.example
├── README.md
├── core/
│   ├── api/
│   │   └── auth/
│   │       ├── github/
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
│       ├── github-oauth.ts
│       ├── oauth-state.ts
│       └── session.ts
└── optional-ui/
    └── AuthButton.tsx
```

## Integration

Copy the `core` directory into your Next.js project.

The API routes should be placed under:

```text
src/app/api/auth/
├── github/
│   ├── route.ts
│   └── callback/
│       └── route.ts
├── logout/
│   └── route.ts
└── me/
    └── route.ts
```

If you place the files under `src/app/api/auth/`, adjust relative imports where necessary to match your project structure.

The `optional-ui/AuthButton.tsx` component provides a basic GitHub sign-in and sign-out interface. Copy it into your application's component directory if you want to use it.

## Authentication Flow

1. The user selects **Sign in with GitHub**.
2. The application generates a cryptographically secure random OAuth state value.
3. The state is stored in a short-lived HTTP-only cookie.
4. The application redirects the user to GitHub's authorization page.
5. GitHub redirects the user to the configured callback URL with an authorization code and state.
6. The callback validates the returned state against the stored cookie.
7. The application exchanges the authorization code for a GitHub access token.
8. The application retrieves the GitHub user profile.
9. The application retrieves the user's primary verified email from GitHub.
10. The database adapter finds an existing linked account or creates and links an application user using the verified email.
11. The application creates a JWT session and stores it in an HTTP-only cookie.
12. The user is redirected to the application.

## API Endpoints

### Start GitHub OAuth

```http
GET /api/auth/github
```

Starts the GitHub OAuth authorization flow and redirects the user to GitHub.

### GitHub OAuth Callback

```http
GET /api/auth/github/callback?code=...&state=...
```

Handles GitHub's authorization response, validates OAuth state, retrieves the user's profile, links or creates the application account, and establishes a session.

### Get Current User

```http
GET /api/auth/me
```

Returns the authenticated user's information.

If no valid session exists, the endpoint returns:

```json
{
  "error": "Unauthorized"
}
```

### Logout

```http
POST /api/auth/logout
```

Deletes the application's session cookie.

## Session Management

The application creates a signed JWT session using `jose`.

Session configuration:

| Setting | Value |
|---|---|
| Cookie name | `auth_session` |
| Session duration | 7 days |
| HTTP-only | Enabled |
| Secure | Enabled in production |
| SameSite | `Lax` |
| Cookie path | `/` |
| JWT algorithm | HS256 |

The authentication secret must contain at least 32 bytes.

## Security Considerations

- OAuth state is generated using cryptographically secure random bytes.
- OAuth state validation uses timing-safe comparison.
- The OAuth state cookie is HTTP-only and expires after 10 minutes.
- The GitHub Client Secret is used only on the server.
- GitHub profile information is retrieved through authenticated server-side requests.
- Only the primary verified GitHub email is accepted.
- Existing accounts are linked using verified email addresses.
- Database constraints prevent duplicate user emails and provider account associations.
- Session cookies use HTTP-only and production Secure settings.
- JWT sessions are validated against the configured issuer and audience.

## Important Limitations

- Users without a primary verified GitHub email cannot sign in through this implementation.
- Account linking is based on the verified GitHub email address.
- Logging out deletes the local session cookie but does not revoke GitHub OAuth authorization.
- Existing JWT sessions remain valid until expiration because server-side session revocation is not implemented.
- Rate limiting and additional abuse protection are not included.

## Customization

You can extend this template to support:

- Additional OAuth providers
- Multiple GitHub accounts per application user
- Account unlinking
- Session revocation
- Additional user profile fields
- Custom post-login redirects

## License

Use and modify this boilerplate according to your project's requirements.
