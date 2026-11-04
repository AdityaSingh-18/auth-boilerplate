# Apple OAuth Authentication — Next.js App Router

A reusable Sign in with Apple authentication boilerplate for Next.js App Router applications.

This implementation uses Apple's OAuth 2.0 authorization-code flow, a server-generated ES256 client secret, ID token verification, and a Neon PostgreSQL database to create or retrieve application users.

## Features

- Sign in with Apple using Apple's hosted authorization page
- OAuth state and nonce validation
- `form_post` callback handling
- Server-side ES256 client secret JWT generation
- Apple ID token verification using Apple's public signing keys
- User identification using Apple's stable `sub` claim
- Neon PostgreSQL user and OAuth account storage
- HTTP-only session cookie using signed JWTs
- Optional sign-in button component
- Logout and current-session endpoints

## Project structure

```text
nextjs-app-router/
├── .env.example
├── README.md
├── core/
│   ├── api/
│   │   └── auth/
│   │       ├── apple/
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
│       ├── apple-oauth.ts
│       ├── auth-db.ts
│       ├── auth.ts
│       ├── oauth-state.ts
│       └── session.ts
└── optional-ui/
    └── AuthButton.tsx
```

## Requirements

- Node.js
- A Next.js App Router project
- A Neon PostgreSQL database
- An Apple Developer account
- A configured Sign in with Apple Services ID
- A Sign in with Apple private key

## Installation

Install the required dependencies:

```bash
pnpm add @neondatabase/serverless jose
```

No additional OAuth client library is required. The implementation uses native `fetch` and Node.js cryptographic utilities.

## Apple Developer configuration

Before using this boilerplate, configure Sign in with Apple in your Apple Developer account.

### 1. Create an App ID

1. Open the Apple Developer portal.
2. Navigate to **Certificates, Identifiers & Profiles**.
3. Create or select an App ID.
4. Enable the **Sign in with Apple** capability.
5. Save the configuration.

### 2. Create a Services ID

1. Create a Services ID.
2. Use its identifier as `APPLE_CLIENT_ID`.
3. Enable **Sign in with Apple** for the Services ID.
4. Configure the associated primary App ID.
5. Add and verify your website domain.
6. Configure the return URL to match `APPLE_REDIRECT_URI` exactly.

The redirect URL must use HTTPS and a domain configured for Sign in with Apple. A plain localhost URL is not a valid production redirect URL; use a suitable HTTPS development domain or tunnel when testing locally.

### 3. Create a Sign in with Apple key

1. Create a new key in the Apple Developer portal.
2. Enable **Sign in with Apple** for the key.
3. Associate it with your primary App ID.
4. Download the `.p8` private key.
5. Record the Key ID.

Keep the private key secure. Never expose it to browser code or commit it to source control.

### 4. Collect your Apple credentials

You will need:

- Team ID
- Services ID
- Key ID
- Private key (`.p8`)

These values are used by the server to generate the Apple client secret JWT.

## Environment variables

Copy `.env.example` into your application's environment file:

```bash
cp .env.example .env.local
```

Configure the following values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Secret used to sign application session JWTs |
| `APPLE_CLIENT_ID` | Apple Services ID |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `APPLE_KEY_ID` | Sign in with Apple key ID |
| `APPLE_PRIVATE_KEY` | Contents of the downloaded `.p8` private key |
| `APPLE_REDIRECT_URI` | Exact HTTPS callback URL registered with Apple |
| `APP_URL` | Base URL of your application |

Example:

```env
DATABASE_URL="your_neon_database_connection_string"
AUTH_SECRET="replace_with_a_random_secret_at_least_32_bytes_long"

APPLE_CLIENT_ID="your_apple_services_id"
APPLE_TEAM_ID="your_apple_developer_team_id"
APPLE_KEY_ID="your_apple_sign_in_key_id"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----"

APPLE_REDIRECT_URI="https://your-domain.com/api/auth/apple/callback"
APP_URL="https://your-domain.com"
```

Generate a strong application session secret:

```bash
openssl rand -base64 32
```

The private key is read and normalized by the server-side implementation. When storing it in an environment variable, preserve the complete PEM content, including its header and footer.

## Database setup

This boilerplate uses Neon PostgreSQL.

Run the SQL schema in `core/db/schema.sql` against your database.

The schema creates:

- `users` — application user records
- `oauth_accounts` — linked OAuth provider accounts

Apple accounts are identified by Apple's stable user identifier (`sub`), stored as the provider account ID.

Email is nullable because an Apple identity response may not provide an email address. The schema's email uniqueness constraint applies only to non-null email values.

## Authentication flow

1. The user selects **Continue with Apple**.
2. The application generates a random OAuth state and nonce.
3. The user is redirected to Apple's authorization page.
4. Apple authenticates the user and submits the authorization response to the callback using `form_post`.
5. The callback validates the returned state against the HTTP-only state cookie.
6. The application exchanges the authorization code for tokens.
7. The server verifies the Apple ID token, including its signature, issuer, audience, and nonce.
8. The application uses the verified Apple subject identifier to find or create the corresponding user and link the OAuth account.
9. The application creates its own signed session and sets an HTTP-only cookie.

The optional name information returned by Apple is handled during the initial authorization response. Apple may not provide it again on subsequent sign-ins, so the application should persist it when it is available.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/apple` | Starts the Apple sign-in flow |
| `POST` | `/api/auth/apple/callback` | Handles Apple's `form_post` callback |
| `POST` | `/api/auth/logout` | Clears the application session |
| `GET` | `/api/auth/me` | Returns the authenticated user |

### Start sign-in

```http
GET /api/auth/apple
```

Redirects the user to Apple's authorization page.

### Apple callback

```http
POST /api/auth/apple/callback
Content-Type: application/x-www-form-urlencoded
```

Apple submits the authorization response to this endpoint using `form_post`.

The callback validates the state, exchanges the authorization code, verifies the ID token, and creates the application session.

### Logout

```http
POST /api/auth/logout
```

Clears the application's session cookie.

### Get current user

```http
GET /api/auth/me
```

Returns the authenticated user when a valid session exists.

Example response:

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "Example User",
    "image_url": null,
    "email_verified": true
  }
}
```

The email and name fields may be `null`.

## Optional UI

The `optional-ui/AuthButton.tsx` component provides a basic Apple sign-in and sign-out interface.

Copy it into your application's component directory and import it where needed:

```tsx
import { AuthButton } from "@/components/AuthButton";

export default function LoginPage() {
  return (
    <main>
      <AuthButton />
    </main>
  );
}
```

Adjust the import path to match where you place the component.

## Security considerations

- **Private key protection:** Keep the Apple `.p8` private key on the server. Never expose it to client-side code.
- **Client secret expiration:** The generated Apple client secret is signed using ES256 and configured with a 180-day expiration. Rotate or regenerate it before it expires.
- **State validation:** The callback validates the OAuth state to protect against login CSRF.
- **Nonce validation:** The nonce in the verified ID token is compared with the nonce stored for the authentication attempt.
- **ID token verification:** The implementation verifies the token signature using Apple's public keys and validates the issuer and audience.
- **HTTPS requirement:** The temporary state and nonce cookies use `SameSite=None; Secure` because Apple's `form_post` callback is cross-site. Use HTTPS for the callback flow.
- **Session security:** Application sessions are stored in HTTP-only cookies and signed with `AUTH_SECRET`.
- **Account identity:** Use Apple's `sub` claim as the provider account identifier rather than relying on email addresses.

## Limitations

- This is a reference implementation, not a complete production identity platform.
- The database user creation and OAuth account linking operations are separate operations rather than one transaction. Review and strengthen transaction handling for production use.
- Email and name may not be returned on every authorization. Store available profile information when it is first provided.
- Apple private relay email addresses may be returned instead of a user's personal email address.
- Application session logout clears the local session cookie; it does not implement global Apple sign-out or server-side revocation of already-issued application JWTs.
- The implementation does not include account recovery, account deletion, or account-management screens.
- HTTPS and a correctly configured Apple Services ID domain and return URL are required for the web callback flow.

## Integration

Copy the `core/` directory into your Next.js application, preserving the route and library structure. Copy `optional-ui/AuthButton.tsx` only if you want the reference UI.

Review import paths after copying, configure the environment variables, apply the database schema, and register the exact callback URL with Apple before testing the flow.