# Microsoft OAuth — Next.js App Router

A Microsoft OAuth 2.0 and OpenID Connect authentication implementation for Next.js App Router.

This template uses the Microsoft identity platform authorization code flow with PKCE, validates the ID token, retrieves the user's profile from Microsoft Graph, and creates an application session using a signed JWT stored in an HTTP-only cookie.

## Features

- Microsoft OAuth 2.0 authorization code flow
- PKCE with S256 code challenge
- OAuth state validation for CSRF protection
- OpenID Connect nonce validation
- Microsoft ID token signature and claims verification
- Microsoft Graph profile retrieval
- Support for personal Microsoft accounts and organizational accounts, subject to app registration and tenant policies
- Tenant-aware account identity using Microsoft tenant ID and object ID
- Neon PostgreSQL database integration
- Signed JWT session stored in an HTTP-only cookie
- Sign-in, sign-out, and current-session endpoints
- Optional sign-in button component

## Tech Stack

- Next.js App Router
- TypeScript
- Microsoft identity platform
- Microsoft Graph API
- Neon PostgreSQL
- `@neondatabase/serverless`
- `jose`

## Project Structure

```text
nextjs-app-router/
├── .env.example
├── README.md
├── core/
│   ├── api/
│   │   └── auth/
│   │       ├── microsoft/
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
│       ├── microsoft-oauth.ts
│       ├── oauth-state.ts
│       └── session.ts
└── optional-ui/
    └── AuthButton.tsx
```

## 1. Requirements

- Node.js
- A Next.js App Router project
- A Microsoft Entra app registration
- A Neon PostgreSQL database

## 2. Install Dependencies

```bash
pnpm add @neondatabase/serverless jose
```

Use the equivalent install command if you use npm or yarn.

## 3. Register a Microsoft Application

1. Open the [Microsoft Entra admin center](https://entra.microsoft.com/).
2. Navigate to **App registrations**.
3. Select **New registration**.
4. Enter an application name.
5. Under **Supported account types**, choose the account types your application needs.

To support both personal Microsoft accounts and organizational accounts, select the option that allows accounts in any organizational directory and personal Microsoft accounts.

6. Under **Redirect URI**, select the **Web** platform.
7. Add your callback URL:

```text
http://localhost:3000/api/auth/microsoft/callback
```

8. Register the application.
9. Copy the **Application (client) ID**.
10. Open **Certificates & secrets** and create a client secret.
11. Copy the secret value immediately and store it securely.

Never expose the client secret in browser-side code or commit it to source control.

For production, add your production callback URL to the app registration and configure your production environment variables.

## 4. Configure Environment Variables

Copy `.env.example` into your project's `.env.local` and configure:

```env
DATABASE_URL="your_neon_database_connection_string"

AUTH_SECRET="your_random_secret_at_least_32_bytes_long"

MICROSOFT_CLIENT_ID="your_microsoft_application_client_id"
MICROSOFT_CLIENT_SECRET="your_microsoft_application_client_secret"

MICROSOFT_REDIRECT_URI="http://localhost:3000/api/auth/microsoft/callback"

APP_URL="http://localhost:3000"
```

Generate a secure session secret rather than using the example value.

`MICROSOFT_REDIRECT_URI` must exactly match the redirect URI registered in Microsoft Entra.

## 5. Set Up the Database

Run the SQL in:

```text
core/db/schema.sql
```

The schema creates two tables:

- `users`: application user records.
- `oauth_accounts`: linked OAuth provider identities.

Microsoft account identity is stored using:

- `provider_tenant_id`: Microsoft tenant ID (`tid`).
- `provider_account_id`: Microsoft object ID (`oid`).

The combination of tenant ID and object ID identifies the Microsoft account. Email is not used as the provider identity.

The user's email is nullable because Microsoft Graph may not return an email address.

## 6. Integrate the Template

The files under `core/` are organized separately so you can integrate them into your existing Next.js application.

### Core library

Copy the contents of:

```text
core/lib/
```

into an appropriate location in your application's source tree, such as:

```text
src/lib/auth/
```

Update relative imports in the route handlers to match the destination.

### API routes

Next.js only registers route handlers placed inside an App Router `app/api` directory.

Move the route handlers into:

```text
src/app/api/auth/
├── microsoft/
│   ├── route.ts
│   └── callback/
│       └── route.ts
├── logout/
│   └── route.ts
└── me/
    └── route.ts
```

Update their imports to point to the location where you copied the core library.

If your project does not use the `src/` directory, use `app/api/` instead.

### Optional UI

Copy:

```text
optional-ui/AuthButton.tsx
```

into your component directory and import it wherever you want to display the Microsoft sign-in button.

The component expects the API endpoints described below.

## 7. Authentication Flow

1. The user selects **Continue with Microsoft**.
2. The application generates an OAuth state, nonce, and PKCE verifier.
3. The application stores temporary values in HTTP-only cookies.
4. The browser is redirected to Microsoft's authorization endpoint.
5. Microsoft authenticates the user and redirects to the callback URL.
6. The callback validates the OAuth state.
7. The application exchanges the authorization code using the PKCE verifier.
8. The ID token is verified against Microsoft's signing keys, including its signature, audience, issuer, expiry, nonce, tenant ID, and object ID.
9. The application retrieves the user's profile from Microsoft Graph.
10. The application finds or creates the corresponding user and OAuth account record.
11. The application creates a signed application session.
12. The user is redirected to the application.

The Microsoft authorization endpoint uses the `/common` authority. Actual account access is still governed by the app registration's supported account types and organizational tenant policies.

## 8. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/microsoft` | Starts Microsoft sign-in |
| GET | `/api/auth/microsoft/callback` | Handles Microsoft's callback |
| POST | `/api/auth/logout` | Deletes the application session |
| GET | `/api/auth/me` | Returns the current authenticated user |

### Current User Response

Successful response:

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "Example User",
    "image_url": null,
    "email_verified": false
  }
}
```

The email may be `null` if Microsoft Graph does not provide one.

Unauthenticated response:

```json
{
  "error": "Unauthorized"
}
```

## 9. Session Management

The application creates a signed JWT using `jose`.

Session details:

- Cookie name: `auth_session`
- Algorithm: HS256
- Lifetime: 7 days
- HTTP-only: enabled
- Secure: enabled in production
- SameSite: Lax
- Path: `/`

The session is an application session. It is separate from the Microsoft access token and Microsoft sign-in session.

Logging out deletes the local application session cookie. It does not sign the user out of Microsoft or revoke their Microsoft sessions.

## 10. Security Considerations

### OAuth state and PKCE

The implementation generates a cryptographically random state value and PKCE verifier. The callback validates the state before exchanging the authorization code.

### OpenID Connect nonce

A nonce is generated before redirecting to Microsoft and checked against the ID token during verification.

### ID token verification

The ID token is verified using Microsoft's published signing keys. The implementation checks the tenant-specific issuer, client ID audience, expiry, nonce, tenant ID, and object ID.

### Tenant-aware account identity

Microsoft accounts are identified by their tenant ID and object ID.

Do not use email as the primary Microsoft account identifier.

### Email handling

Microsoft Graph's `mail` and `userPrincipalName` values are treated as optional profile information.

This implementation does not assert that the returned email is verified. It also does not automatically link an existing application account based on matching email addresses.

Applications that require verified email ownership should implement a separate verification process.

### Client secret protection

Keep `MICROSOFT_CLIENT_SECRET` and `AUTH_SECRET` on the server. Never expose them through client-side environment variables.

### Additional production safeguards

Before deploying, consider adding:

- Rate limiting to authentication endpoints.
- Monitoring and alerting for repeated authentication failures.
- Session rotation and revocation support.
- Database transaction handling for concurrent account creation.
- A secure account-linking process.
- Appropriate tenant restrictions if your application is not intended for every supported Microsoft account type.

## 11. Limitations

- The implementation uses Neon PostgreSQL as its database adapter.
- Microsoft access and refresh tokens are not persisted.
- The application session lasts seven days.
- Logging out deletes only the local application session.
- There is no centralized session revocation mechanism.
- There is no built-in IP-based rate limiting.
- Email is optional and is not treated as verified.
- Account creation and OAuth account linking are separate database operations; production deployments should consider transaction-safe handling of concurrent requests.

## 12. Customization

You can extend this implementation to:

- Add other database adapters.
- Restrict access to specific Microsoft tenants.
- Add role-based authorization.
- Add session revocation and rotation.
- Implement a verified email workflow.
- Customize the sign-in interface.

---

**Authentication method:** Microsoft OAuth 2.0 / OpenID Connect

**Framework:** Next.js App Router

**Database adapter:** Neon PostgreSQL

**Session strategy:** Signed JWT in an HTTP-only cookie
