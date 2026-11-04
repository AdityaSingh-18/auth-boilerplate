# Google OAuth Authentication Boilerplate

A reusable Google OAuth 2.0 authentication implementation for Next.js App Router applications using Neon PostgreSQL.

This template allows users to sign in with their Google accounts using Google's official account selection and consent experience.

## Features

- Google OAuth 2.0 authorization-code flow
- PKCE with S256 code challenge
- CSRF protection using a cryptographically random state value
- HTTP-only, short-lived OAuth state and PKCE cookies
- Authorization-code exchange with Google
- Google ID token verification using `jose` and Google's public signing keys
- Verified Google email validation
- Automatic user creation and Google account linking
- Neon PostgreSQL database integration
- JWT-based application sessions
- HTTP-only authentication cookie
- Optional Google sign-in UI component

## Tech Stack

- Next.js App Router
- TypeScript
- Neon PostgreSQL
- Google OAuth 2.0
- `jose`
- Node.js built-in `crypto`
- Native Fetch API

## Project Structure

```text
nextjs-app-router/
├── README.md
├── .env.example
│
├── core/
│   ├── api/
│   │   └── auth/
│   │       ├── google/
│   │       │   ├── route.ts
│   │       │   └── callback/
│   │       │       └── route.ts
│   │       ├── logout/
│   │       │   └── route.ts
│   │       └── me/
│   │           └── route.ts
│   │
│   ├── db/
│   │   └── schema.sql
│   │
│   └── lib/
│       ├── auth.ts
│       ├── auth-db.ts
│       ├── google-oauth.ts
│       ├── oauth-state.ts
│       └── session.ts
│
└── optional-ui/
    └── AuthButton.tsx
```

## 1. Installation

Install the required dependencies:

```bash
pnpm add @neondatabase/serverless jose
```

The implementation uses Node.js built-in cryptographic functions, so no additional PKCE package is required.

## 2. Google Cloud Console Setup

Create a Google Cloud project or select an existing project.

### Configure OAuth consent

1. Open the Google Auth Platform in Google Cloud Console.
2. Configure your application information.
3. Configure the audience and test users as appropriate.
4. Add the following scopes:

```text
openid
email
profile
```

### Create OAuth credentials

1. Open the Clients section.
2. Create an OAuth client ID.
3. Select **Web application**.
4. Add an authorized redirect URI.

For local development:

```text
http://localhost:3000/api/auth/google/callback
```

For production, use your deployed application's callback URL.

The redirect URI must exactly match the URI configured in Google Cloud Console.

Copy the generated client ID and client secret.

## 3. Environment Variables

Create a `.env.local` file in your Next.js application root.

Use `.env.example` as the reference:

```env
DATABASE_URL="your_neon_database_connection_string"

AUTH_SECRET="your_random_session_secret_at_least_32_bytes_long"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

APP_URL="http://localhost:3000"
```

Generate a secure application session secret:

```bash
openssl rand -base64 32
```

Use a different secret for every environment.

Never commit `.env.local` or expose your Google client secret to the browser.

## 4. Database Setup

This template uses Neon PostgreSQL.

Open your Neon SQL Editor and execute:

```text
core/db/schema.sql
```

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

### oauth_accounts

Stores linked OAuth identities:

- `id`
- `user_id`
- `provider`
- `provider_account_id`
- `created_at`

The combination of `provider` and `provider_account_id` is unique.

Google's stable account identifier (`sub`) is stored as `provider_account_id`.

This allows the application to identify a Google account independently of its email address.

## 5. Authentication Flow

The implementation follows the OAuth 2.0 authorization-code flow with PKCE.

### Step 1: Start Google sign-in

The user clicks:

```text
Continue with Google
```

The application redirects the browser to:

```text
GET /api/auth/google
```

The route:

1. Generates a cryptographically random OAuth state.
2. Generates a PKCE code verifier.
3. Creates an S256 code challenge.
4. Stores the state and verifier in short-lived HTTP-only cookies.
5. Redirects the browser to Google's authorization endpoint.

### Step 2: Google authentication

Google displays its official sign-in and account selection experience.

The user selects a Google account and grants consent if required.

Google redirects the browser to the configured callback URL.

### Step 3: Validate the OAuth response

The callback route:

```text
GET /api/auth/google/callback
```

The application:

1. Retrieves the OAuth state and PKCE verifier from cookies.
2. Compares the returned state with the stored state.
3. Rejects missing or mismatched OAuth parameters.
4. Exchanges the authorization code using the PKCE verifier.

### Step 4: Verify Google identity

The application verifies the returned ID token using Google's public signing keys.

It validates:

- Token signature
- Token issuer
- Token audience
- Token expiration
- Google account identifier (`sub`)
- Email availability
- Verified email claim

Only identities with a verified Google email are accepted.

### Step 5: Create or link the account

The application checks whether the Google identity is already linked.

If it exists, the associated application user is retrieved.

Otherwise, the application looks for an existing user with the same verified email address.

If an existing verified user is found, the Google identity is linked to that user.

If no user exists, a new user is created and the Google identity is linked.

### Step 6: Create an application session

After successful authentication, the application creates its own JWT session.

The session is stored in an HTTP-only cookie named:

```text
auth_session
```

The user is redirected to the application homepage.

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/google` | Starts Google OAuth |
| GET | `/api/auth/google/callback` | Handles Google's callback |
| POST | `/api/auth/logout` | Clears the session cookie |
| GET | `/api/auth/me` | Retrieves the authenticated user |

### Start Google sign-in

```text
GET /api/auth/google
```

Redirects the browser to Google's authorization page.

### Google callback

```text
GET /api/auth/google/callback?code=...&state=...
```

Processes Google's authorization response and establishes an application session.

### Logout

```text
POST /api/auth/logout
```

Response:

```json
{
  "message": "Logged out successfully."
}
```

### Current user

```text
GET /api/auth/me
```

Successful response:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@gmail.com",
    "name": "Example User",
    "image_url": "https://example.com/profile.jpg",
    "email_verified": true
  }
}
```

An unauthenticated request returns HTTP 401.

## 7. Optional UI Integration

The template includes:

```text
optional-ui/AuthButton.tsx
```

This component provides:

- Continue with Google button
- Current session detection
- User profile display
- Logout button
- Basic error feedback

Import it into a page or component:

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

Adjust the import path to match where you place the optional UI component.

The component expects the authentication endpoints to be available at the paths documented above.

## 8. Integrating the Core Files

The `core/` directory contains template source files rather than active Next.js routes.

When integrating into a Next.js application, copy the files into their corresponding locations.

For example:

```text
core/api/auth/google/route.ts
    → src/app/api/auth/google/route.ts

core/api/auth/google/callback/route.ts
    → src/app/api/auth/google/callback/route.ts

core/api/auth/logout/route.ts
    → src/app/api/auth/logout/route.ts

core/api/auth/me/route.ts
    → src/app/api/auth/me/route.ts
```

Copy the library files into your application's `src/lib/` directory and the database schema into your database setup workflow.

Update relative imports where necessary after moving files.

## 9. Security Notes

- OAuth state validation protects against CSRF attacks during the authorization flow.
- PKCE uses the S256 method to protect authorization-code exchange.
- OAuth state and PKCE verifier cookies are HTTP-only and expire after 10 minutes.
- Google ID tokens are verified using Google's public signing keys.
- The token issuer and audience are validated.
- Only Google accounts with verified email addresses are accepted.
- Google account identifiers are stored separately from application user records.
- Database operations use parameterized Neon queries.
- Session cookies are HTTP-only, use `SameSite=Lax`, and use `Secure` in production.
- The application session expires after seven days.
- The Google client secret and application session secret must remain server-side.
- Clearing the session cookie during logout does not revoke an already copied JWT. It remains valid until expiration.
- The implementation does not provide refresh-token management or immediate server-side session revocation.
- Account creation and account linking should be reviewed and tested under concurrent requests before production deployment.
- The callback currently uses a GET request and creates an authenticated session as part of callback processing. Ensure your deployment and integration account for automated callback URL scanners.
- Use HTTPS in production and configure the exact production redirect URI in Google Cloud Console.

## 10. Important Limitations

This boilerplate provides a starting point for Google OAuth authentication.

It does not include:

- Password-based authentication
- Email OTP verification
- Password recovery
- Account deletion
- Account unlinking
- Multi-factor authentication
- Refresh-token storage
- Immediate session revocation
- Role-based access control

These features can be implemented separately according to application requirements.

---

**Google OAuth authentication boilerplate**

Explore the implementation, understand the code, download the template, and integrate it into your Next.js application.
