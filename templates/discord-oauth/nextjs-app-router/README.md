# Discord OAuth Authentication — Next.js App Router

A reusable Discord OAuth2 authentication boilerplate for Next.js App Router applications. It uses Discord's OAuth2 authorization-code flow to authenticate users, retrieve their Discord profile and verified email address, persist user accounts in Neon Postgres, and create an application session using a signed JWT.

## Features

- Discord OAuth2 authorization-code flow
- OAuth state generation and validation to protect against CSRF
- Discord profile retrieval using the Discord API
- Requests the `identify` and `email` OAuth2 scopes
- Requires a verified Discord email address
- Neon Postgres user and OAuth account persistence
- Links a Discord account to an existing user when the verified email matches
- JWT-based application sessions using `jose`
- HTTP-only session cookies
- Optional client-side sign-in and sign-out component

## Requirements

- Node.js
- A Next.js App Router project
- A Discord application
- A Neon Postgres database

## Installation

Install the required dependencies in your Next.js project:

```bash
pnpm add @neondatabase/serverless jose
```

Use the equivalent command for your package manager if you are not using pnpm.

## Discord application setup

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a new application or select an existing application.
3. Open the application's **OAuth2** settings.
4. Add your callback URL under **Redirects**:

   ```text
   http://localhost:3000/api/auth/discord/callback
   ```

5. Copy the application's **Client ID** and **Client Secret**.

The authorization URL in this template requests the following OAuth2 scopes:

- `identify` — retrieve the authenticated Discord user's profile.
- `email` — request the user's email address.

The user must authorize the requested scopes for the application to retrieve the corresponding profile information.

For production, register your production callback URL in the Discord Developer Portal and use the matching URL in your environment configuration.

## Environment variables

Create a `.env.local` file in your Next.js project using `.env.example` as a reference:

```env
DATABASE_URL="your_neon_database_connection_string"
AUTH_SECRET="replace_with_a_random_secret_at_least_32_bytes_long"

DISCORD_CLIENT_ID="your_discord_application_client_id"
DISCORD_CLIENT_SECRET="your_discord_application_client_secret"
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback"

APP_URL="http://localhost:3000"
```

### Generate an application secret

Generate a cryptographically secure secret of at least 32 bytes:

```bash
openssl rand -base64 32
```

Use the generated value for `AUTH_SECRET`.

Keep your client secret, database connection string, and application secret private. Never expose them through client-side environment variables or commit them to version control.

## Database setup

Run the SQL in:

```text
core/db/schema.sql
```

against your Neon Postgres database.

The schema creates two tables:

### `users`

Stores application user information:

- `id`
- `email`
- `name`
- `image_url`
- `email_verified`
- `created_at`
- `updated_at`

A unique index on the normalized email address prevents duplicate email accounts.

### `oauth_accounts`

Stores linked OAuth provider accounts:

- `id`
- `user_id`
- `provider`
- `provider_account_id`
- `created_at`

A unique constraint on `(provider, provider_account_id)` prevents the same Discord account from being linked to multiple application users.

## Project structure

```text
nextjs-app-router/
├── .env.example
├── README.md
├── core/
│   ├── api/
│   │   └── auth/
│   │       ├── discord/
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
│       ├── auth-db.ts
│       ├── auth.ts
│       ├── discord-oauth.ts
│       ├── oauth-state.ts
│       └── session.ts
└── optional-ui/
    └── AuthButton.tsx
```

## Integrating the template

The `core/api/` directory organizes the Next.js route-handler source files. Next.js only registers route handlers when they are placed in the application's `app/` directory.

Copy the route-handler files into the corresponding App Router locations:

```text
src/app/api/auth/
├── discord/
│   ├── route.ts
│   └── callback/
│       └── route.ts
├── logout/
│   └── route.ts
└── me/
    └── route.ts
```

Keep the library files under `core/lib/` and the SQL schema under `core/db/`. Adjust relative imports if your destination directories differ from the template structure.

The optional `AuthButton.tsx` can be imported into a client component or page:

```tsx
import AuthButton from "@/components/auth/AuthButton";

export default function LoginPage() {
  return (
    <main>
      <h1>Sign in</h1>
      <AuthButton />
    </main>
  );
}
```

Adjust the import path to wherever you place the component.

## Authentication flow

1. The user selects **Continue with Discord**.
2. The application generates a cryptographically random OAuth state value.
3. The application stores the state in an HTTP-only cookie and redirects the user to Discord.
4. Discord asks the user to authorize the requested scopes.
5. Discord redirects the user to the registered callback URL with an authorization code and state.
6. The callback validates the returned state against the stored cookie.
7. The application exchanges the authorization code for an access token.
8. The application requests the user's profile from Discord's API.
9. The application requires a verified email address and looks up or creates the corresponding application user.
10. The Discord account is linked to the application user.
11. The application creates a signed JWT session and sets it in an HTTP-only cookie.
12. The user is redirected to the application homepage.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/discord` | Starts Discord OAuth2 authentication |
| GET | `/api/auth/discord/callback` | Handles the Discord OAuth2 callback |
| POST | `/api/auth/logout` | Deletes the application session cookie |
| GET | `/api/auth/me` | Returns the authenticated application user |

### GET `/api/auth/discord`

Starts the OAuth2 flow by generating a state value, setting the state cookie, and redirecting the user to Discord's authorization endpoint.

### GET `/api/auth/discord/callback`

Handles the authorization response, validates the state, exchanges the authorization code, retrieves the Discord profile, links or creates the application user, and establishes a session.

On failure, the user is redirected to:

```text
/login?error=discord_sign_in_failed
```

### POST `/api/auth/logout`

Deletes the application's session cookie.

### GET `/api/auth/me`

Returns the current authenticated user:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Discord User",
    "image_url": "https://cdn.discordapp.com/...",
    "email_verified": true
  }
}
```

Unauthenticated requests return `401 Unauthorized`.

## Session configuration

The application session is a signed JWT created with `jose`.

| Setting | Value |
|---|---|
| Cookie name | `auth_session` |
| Algorithm | HS256 |
| Session lifetime | 7 days |
| HTTP-only | Yes |
| SameSite | Lax |
| Secure | Enabled in production |
| Path | `/` |

The session secret is read from `AUTH_SECRET` and must contain at least 32 bytes.

## Security considerations

- **OAuth state validation:** A random state value is generated for each authorization attempt and compared during the callback using a timing-safe comparison.
- **Verified email requirement:** Authentication is rejected if Discord does not return an email address marked as verified.
- **Account linking:** A Discord account is linked using its stable provider account ID. An existing application account can be reused when its email matches the verified Discord email.
- **Session cookie:** The application session is stored in an HTTP-only cookie to prevent direct JavaScript access.
- **Secret management:** OAuth credentials, database credentials, and the session secret must remain server-side.
- **HTTPS:** Use HTTPS in production so secure cookies and OAuth redirects are protected in transit.

## Current limitations

This is a reference implementation intended to be integrated and adapted to your application.

- No IP-based rate limiting is implemented for OAuth endpoints.
- OAuth access and refresh tokens are not persisted for ongoing Discord API access.
- Logging out deletes the local application session but does not revoke the application's Discord authorization.
- Existing application sessions are not centrally revocable.
- The implementation requires Discord to return a verified email address.
- The database user creation and OAuth account linking operations are separate operations, not one database transaction.

Review the implementation and adapt its database, session, error-handling, and operational policies before using it in production.

## License

Use and modify this boilerplate according to the license of the repository that distributes it.