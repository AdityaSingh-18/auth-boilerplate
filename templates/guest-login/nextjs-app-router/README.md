# Guest Login — Next.js App Router

A reusable guest authentication boilerplate for Next.js App Router applications using Neon PostgreSQL and signed JWT sessions.

It allows visitors to start using an application without creating a permanent account. A guest account can later be promoted by linking a verified identity from an authentication provider, while preserving the original user ID and associated application data.

## Features

- Create temporary guest accounts.
- Start an authenticated session automatically.
- Store guest users in PostgreSQL.
- Retrieve the currently authenticated user.
- Log out by clearing the session cookie.
- Promote a guest account by linking a verified external identity.
- Preserve the guest user's original ID during promotion.
- Prevent the same provider identity from being linked to multiple users.
- Include an optional client-side guest login component.

## Technology stack

- Next.js App Router
- TypeScript
- Neon PostgreSQL
- `@neondatabase/serverless`
- `jose` for JWT session signing and verification

## Requirements

- Node.js compatible with your Next.js version.
- A Next.js App Router project.
- A Neon PostgreSQL database.
- An authentication provider or trusted verification flow if you intend to implement account promotion.

## Installation

Install the required dependencies:

```bash
pnpm add @neondatabase/serverless jose
```

For npm:

```bash
npm install @neondatabase/serverless jose
```

## Environment variables

Add the following variables to your application's `.env.local` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# Generate with: openssl rand -base64 32
AUTH_SECRET="replace-with-at-least-32-random-bytes"
```

`DATABASE_URL` is the connection string for your Neon PostgreSQL database.

`AUTH_SECRET` is used to sign and verify session JWTs. Use a securely generated secret containing at least 32 bytes. Keep it private and do not commit it to version control.

## Database setup

Run the SQL in `core/db/schema.sql` against your Neon database.

The schema creates three database structures.

### 1. users

Stores application user records.

| Column | Description |
|---|---|
| `id` | UUID primary key |
| `is_guest` | Indicates whether the account is a guest |
| `created_at` | Account creation timestamp |
| `updated_at` | Last account update timestamp |

New guest users are created with `is_guest = TRUE`.

After successful identity linking, the account is updated to `is_guest = FALSE`.

### 2. auth_identities

Stores external identities linked to application users.

| Column | Description |
|---|---|
| `id` | Identity record UUID |
| `user_id` | Associated application user |
| `provider` | Identity provider identifier |
| `provider_account_id` | Stable account ID from the provider |
| `email` | Optional email metadata |
| `email_verified` | Whether the provider has verified the email |
| `created_at` | Identity creation timestamp |
| `updated_at` | Last identity update timestamp |

The combination of `provider` and `provider_account_id` is unique.

This prevents one provider identity from being linked to multiple application users.

### 3. Relationships

One application user can have multiple linked identities.

For example, a user could eventually link Google and GitHub identities to the same application account.

The database does not automatically merge users based on matching email addresses.

**Important:** Adapt the minimal `users` table to your existing application user model if necessary. If your project already has a users table, preserve its existing schema and add the required guest-account field and identity relationship appropriately.

## Project structure

```text
nextjs-app-router/
├── .env.example
├── README.md
│
├── core/
│   ├── db/
│   │   └── schema.sql
│   │
│   ├── lib/
│   │   ├── auth-db.ts
│   │   ├── auth.ts
│   │   └── session.ts
│   │
│   └── api/
│       └── auth/
│           ├── guest/
│           │   └── route.ts
│           ├── me/
│           │   └── route.ts
│           └── logout/
│               └── route.ts
│
└── optional-ui/
    └── GuestLoginButton.tsx
```

## Next.js route integration

The files under `core/api` are template source files. Next.js does not automatically register routes from this directory.

Copy the route files into the appropriate App Router locations:

| Template source | Next.js destination |
|---|---|
| `core/api/auth/guest/route.ts` | `src/app/api/auth/guest/route.ts` |
| `core/api/auth/me/route.ts` | `src/app/api/auth/me/route.ts` |
| `core/api/auth/logout/route.ts` | `src/app/api/auth/logout/route.ts` |

If your project does not use the `src` directory, use `app/api/...` instead.

After copying the routes, update their relative imports to point to the copied `core/lib` files, or use your project's TypeScript path alias.

The library files can be placed in your application's `src/lib` directory. Update imports accordingly.

## API endpoints

### 1. Start a guest session

**Endpoint**

```http
POST /api/auth/guest
```

Creates a guest user and starts a session.

If a valid session already exists, the existing user is returned instead of creating another guest account.

Example response:

```json
{
  "success": true,
  "user": {
    "id": "USER_UUID",
    "isGuest": true
  }
}
```

### 2. Get the current user

**Endpoint**

```http
GET /api/auth/me
```

Returns the currently authenticated user.

Example response:

```json
{
  "success": true,
  "user": {
    "id": "USER_UUID",
    "isGuest": true,
    "createdAt": "2026-01-01T10:00:00.000Z"
  }
}
```

If there is no valid session, the endpoint returns HTTP `401`.

### 3. Log out

**Endpoint**

```http
POST /api/auth/logout
```

Clears the session cookie.

Example response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Guest account lifecycle

### Step 1 — Create a guest account

The application calls:

```http
POST /api/auth/guest
```

The server creates a user record with `is_guest = TRUE`.

A signed session JWT is then issued in an HTTP-only cookie.

### Step 2 — Use the application

The guest can use application features that permit guest access.

Application-specific data should reference the guest's user ID so that it can remain associated with the same user after promotion.

### Step 3 — Verify a permanent identity

When the visitor chooses to create or connect a permanent account, the application must first authenticate and verify an identity through a trusted server-side flow.

Examples include:

- Google OAuth
- GitHub OAuth
- Verified email authentication
- Another trusted identity provider

This template does not implement those provider authentication flows.

### Step 4 — Promote the guest account

After successful identity verification, the server can call:

```ts
await promoteCurrentGuestAccount({
  provider: "google",
  providerAccountId: verifiedGoogleAccountId,
  email: verifiedEmail,
  emailVerified: true,
});
```

The example values must come from the provider's verified server-side response, not directly from browser input.

The promotion helper:

1. Checks that the current user is a guest.
2. Attempts to link the verified identity.
3. Rejects an identity already linked to another user.
4. Changes `is_guest` to `FALSE`.
5. Preserves the original user ID.

The existing session remains valid because the user ID does not change.

**This helper is not exposed as a public API route in this template.** Call it from a trusted server-side provider callback or account-linking handler after verifying the identity.

## Session management

Sessions are implemented in `core/lib/session.ts`.

The session uses a signed JWT with:

- HS256 signing algorithm.
- Seven-day expiration.
- Issuer validation.
- Audience validation.
- HTTP-only cookie.
- `SameSite=Lax`.
- Secure cookies in production.
- Root path `/`.

The cookie name is:

```text
auth_session
```

The session contains the user's ID as the JWT subject.

The server verifies the JWT before retrieving the corresponding user record.

### Session limitations

This implementation uses stateless JWT sessions.

Logging out clears the browser cookie, but does not revoke a previously issued JWT on the server. A copied token may remain valid until its expiration.

For applications requiring immediate session revocation, consider adding server-side session records or a token revocation mechanism.

## Optional UI

The optional UI component is located at:

```text
optional-ui/GuestLoginButton.tsx
```

Copy it into your application's components directory, for example:

```text
src/components/GuestLoginButton.tsx
```

Then import it into a page:

```tsx
import GuestLoginButton from "@/components/GuestLoginButton";

export default function GuestPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <GuestLoginButton />
    </main>
  );
}
```

The component supports:

- Checking the current session.
- Starting a guest session.
- Displaying the current user ID.
- Showing guest or permanent account status.
- Logging out.
- Refreshing the session display.
- Loading and error states.

The component expects the API endpoints described above to be registered in your Next.js application.

## Security considerations

### Verify identities on the server

Never trust provider IDs, email addresses, or `emailVerified` values submitted directly by a browser.

Only pass an identity to `promoteGuestAccount()` after validating it through the appropriate provider authentication flow.

### Do not automatically merge accounts by email

Matching email addresses do not necessarily prove that two accounts belong to the same person.

This implementation links identities using the provider and its stable account ID. It does not automatically merge an existing account based on email.

### Protect account-linking operations

Account promotion should require an authenticated guest session and a completed identity verification flow.

Add appropriate CSRF protections, rate limiting, and abuse prevention to your production account-linking endpoints.

### Protect the session secret

Use a strong, randomly generated `AUTH_SECRET`. Do not expose it in client-side code or commit it to source control.

### Guest account cleanup

Guest accounts may accumulate over time.

If your application needs guest account cleanup, implement a retention policy based on your application's data requirements. Do not delete guest records without considering associated user data and account-promotion behavior.

### Database permissions

Use a database connection with only the permissions required by your application. Protect the connection string and never expose it to the browser.

## Important limitations

This boilerplate provides the guest-account foundation, not a complete identity-provider integration.

It does not currently include:

- Google, GitHub, or other OAuth implementation.
- Email/password registration.
- Email verification.
- A public account-promotion API route.
- Automatic account merging.
- Server-side session revocation.
- Guest account expiration or scheduled cleanup.
- Built-in rate limiting or CAPTCHA.
- Application-specific guest data storage.

These features can be added separately according to the requirements of the application.

## Production integration checklist

Before using this implementation in production:

- [ ] Configure the Neon database connection.
- [ ] Set a strong `AUTH_SECRET`.
- [ ] Run the database schema or adapt it to your existing user model.
- [ ] Copy the API routes into the Next.js App Router.
- [ ] Update imports after moving the files.
- [ ] Test guest account creation.
- [ ] Test session retrieval and logout.
- [ ] Implement and test a trusted identity-verification flow before enabling promotion.
- [ ] Test that an identity linked to another user is rejected.
- [ ] Add CSRF protection and rate limiting where appropriate.
- [ ] Define a guest account data-retention policy.

## License

Use and modify this boilerplate according to the license and terms of the parent project.
