# SAML SSO Authentication Boilerplate

A SAML 2.0 Service Provider-initiated Single Sign-On implementation for Next.js App Router.

This boilerplate demonstrates how to authenticate users through an administrator-configured SAML Identity Provider, validate signed SAML responses and assertions, map identity attributes, store external identities in Neon PostgreSQL, and create application sessions using signed JWT cookies.

## Features

- SAML 2.0 Service Provider-initiated authentication
- HTTP-Redirect authentication request
- HTTP-POST Assertion Consumer Service (ACS)
- Administrator-configured Identity Provider
- Trusted Identity Provider signing certificate
- SAML response and assertion signature validation
- Issuer and audience validation
- `InResponseTo` request correlation
- Short-lived `RelayState` validation
- Assertion expiration and replay protection
- Configurable email and display-name attribute mapping
- Neon PostgreSQL user and external identity storage
- Stable external identity mapping using `(idp_issuer, name_id)`
- JWT application sessions using `jose`
- HTTP-only session cookies
- Optional React sign-in component

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js App Router | Application framework |
| TypeScript | Type safety |
| `@node-saml/node-saml` | SAML authentication and response validation |
| Neon PostgreSQL | User and SAML identity storage |
| `@neondatabase/serverless` | PostgreSQL database client |
| `jose` | Application session JWT creation and verification |
| React | Optional sign-in interface |

## Project Structure

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
│   │   ├── saml-config.ts
│   │   ├── saml-request.ts
│   │   ├── saml-response.ts
│   │   └── session.ts
│   └── api/
│       └── auth/
│           ├── saml/
│           │   ├── login/
│           │   │   └── route.ts
│           │   └── acs/
│           │       └── route.ts
│           ├── logout/
│           │   └── route.ts
│           └── me/
│               └── route.ts
└── optional-ui/
    └── SamlSignIn.tsx
```

## 1. Installation

Install the required packages:

```bash
pnpm add @node-saml/node-saml @neondatabase/serverless jose
```

Or use npm:

```bash
npm install @node-saml/node-saml @neondatabase/serverless jose
```

The SAML routes require the Node.js runtime because the Node-SAML implementation uses Node.js functionality.

## 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Configure the following environment variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Application session JWT signing secret; minimum 32 bytes |
| `APP_URL` | Yes | Public application base URL |
| `SAML_SP_ENTITY_ID` | Yes | Service Provider entity ID |
| `SAML_ACS_URL` | Yes | Assertion Consumer Service callback URL |
| `SAML_IDP_ENTRY_POINT` | Yes | Identity Provider SSO endpoint |
| `SAML_IDP_ISSUER` | Yes | Expected Identity Provider issuer |
| `SAML_IDP_CERT` | Yes | Trusted Identity Provider signing certificate in PEM format |
| `SAML_SP_PRIVATE_KEY` | No | Service Provider private key for signing authentication requests |
| `SAML_SP_PUBLIC_CERT` | No | Matching Service Provider public certificate |
| `SAML_EMAIL_ATTRIBUTE` | No | Identity Provider email attribute; defaults to `email` |
| `SAML_NAME_ATTRIBUTE` | No | Identity Provider display-name attribute; defaults to `displayName` |

Generate an application session secret:

```bash
openssl rand -base64 32
```

Use the generated value for `AUTH_SECRET`.

### Certificate configuration

Obtain the Identity Provider signing certificate from a trusted administrative source.

The `SAML_IDP_CERT` value must contain the PEM certificate, including its BEGIN and END lines.

For example:

```dotenv
SAML_IDP_CERT="-----BEGIN CERTIFICATE-----\n<your-idp-certificate>\n-----END CERTIFICATE-----"
```

The configuration helper converts escaped newline sequences into real newlines.

If your Identity Provider requires signed authentication requests, configure both:

- `SAML_SP_PRIVATE_KEY`
- `SAML_SP_PUBLIC_CERT`

Do not configure only one of these variables.

Keep private keys and signing secrets out of source control.

## 3. Configure Your Identity Provider

Register your application as a SAML Service Provider with your Identity Provider.

Configure the following values in the Identity Provider administration console.

### Service Provider details

| Setting | Value |
|---|---|
| SP Entity ID / Audience | Value of `SAML_SP_ENTITY_ID` |
| ACS URL / Reply URL | Value of `SAML_ACS_URL` |
| Binding | HTTP-POST for the ACS |
| NameID | Persistent, stable identifier |
| Requested attributes | Email and display name, if available |

Example local configuration:

```text
SP Entity ID:
http://localhost:3000/saml/metadata

ACS URL:
http://localhost:3000/api/auth/saml/acs
```

These URLs are examples. Use the exact public URLs configured in your application and Identity Provider.

### Identity Provider details

Obtain these values from your Identity Provider:

1. SSO entry-point URL.
2. Identity Provider issuer/entity ID.
3. Identity Provider signing certificate.
4. Email attribute name.
5. Display-name attribute name.

Add them to `.env.local`.

### Signature requirements

This implementation configures Node-SAML to require:

- Signed SAML authentication responses.
- Signed SAML assertions.
- The configured Identity Provider issuer.
- The configured Service Provider audience.
- A response correlated to an SP-initiated authentication request.
- Valid assertion time conditions.
- Assertion replay protection.

Configure your Identity Provider to satisfy these requirements.

Some Identity Providers sign only the assertion or only the response. Such configurations are not compatible with the strict signature settings in this reference implementation without deliberately changing the verification policy.

## 4. Database Setup

The implementation uses Neon PostgreSQL.

Create a Neon project and configure `DATABASE_URL`.

Run the schema:

```sql
-- Run core/db/schema.sql in your Neon SQL editor.
```

The schema creates two tables:

### `users`

Stores application user profiles.

| Column | Purpose |
|---|---|
| `id` | Application user UUID |
| `email` | Optional email attribute |
| `name` | Optional display name |
| `created_at` | Account creation timestamp |
| `updated_at` | Account update timestamp |

### `saml_accounts`

Stores external SAML identity mappings.

| Column | Purpose |
|---|---|
| `id` | SAML account UUID |
| `user_id` | Linked application user |
| `idp_issuer` | Identity Provider issuer |
| `name_id` | External SAML subject identifier |
| `name_id_format` | NameID format |
| `created_at` | Identity creation timestamp |
| `updated_at` | Identity update timestamp |

The database enforces uniqueness on:

```sql
UNIQUE (idp_issuer, name_id)
```

This prevents the same external identity from being linked to multiple application users.

### Account linking behavior

The external identity is identified by:

```text
Identity Provider issuer + NameID
```

Email is stored as a profile attribute, not as the external identity key.

The implementation does not automatically merge accounts based on matching email addresses.

Configure your Identity Provider to issue a persistent NameID. A transient or changing NameID may result in a new application identity on subsequent logins.

## 5. Integrate the API Routes

The template keeps authentication code under `core/` to make it easy to inspect and reuse.

Next.js App Router does not automatically discover route handlers under `core/api`.

Copy the route handlers into the appropriate application route directories.

Expected integration structure:

```text
src/
└── app/
    └── api/
        └── auth/
            ├── saml/
            │   ├── login/
            │   │   └── route.ts
            │   └── acs/
            │       └── route.ts
            ├── logout/
            │   └── route.ts
            └── me/
                └── route.ts
```

Keep the shared implementation files under a suitable server-only library directory, such as:

```text
src/
└── lib/
    └── auth/
        ├── auth.ts
        ├── auth-db.ts
        ├── saml-config.ts
        ├── saml-request.ts
        ├── saml-response.ts
        └── session.ts
```

Update relative imports after moving the files.

Do not import server-only authentication modules into Client Components.

### Runtime configuration

The SAML route handlers must run in the Node.js runtime.

Keep:

```ts
export const runtime = "nodejs";
```

in the SAML login, ACS, logout, and current-user route handlers.

## 6. Optional Sign-In UI

The template includes:

```text
optional-ui/SamlSignIn.tsx
```

Copy it into:

```text
src/components/auth/SamlSignIn.tsx
```

Use it in a login page:

```tsx
import SamlSignIn from "@/components/auth/SamlSignIn";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <SamlSignIn />
      </div>
    </main>
  );
}
```

The component:

- Checks the current application session.
- Displays the authenticated user.
- Starts SAML login.
- Provides a local sign-out action.

The UI is optional. You can implement your own interface using the same endpoints.

## 7. Authentication Flow

The implementation uses Service Provider-initiated SAML authentication.

```text
User
  |
  | Opens login page
  v
Next.js Application
  |
  | GET /api/auth/saml/login
  v
Generate authentication request
  |
  | Create RelayState
  | Create SAML AuthnRequest
  v
Identity Provider
  |
  | User authenticates
  | Returns signed SAML response
  v
POST /api/auth/saml/acs
  |
  | Validate RelayState
  | Validate SAML response and assertion
  | Validate issuer, audience and request correlation
  | Validate assertion time conditions
  v
Neon PostgreSQL
  |
  | Find external identity
  | Create user if identity does not exist
  v
Create application JWT session
  |
  | Set HTTP-only auth_session cookie
  v
Redirect to application dashboard
```

### Login

The browser requests:

```http
GET /api/auth/saml/login
```

The application:

1. Generates a cryptographically random RelayState.
2. Creates an SP-initiated SAML authentication request.
3. Stores RelayState in a short-lived HTTP-only cookie.
4. Redirects the browser to the configured Identity Provider.

### Identity Provider authentication

The Identity Provider authenticates the user and returns a SAML response using HTTP-POST binding.

### Assertion Consumer Service

The browser submits the response to:

```http
POST /api/auth/saml/acs
```

The ACS handler:

1. Checks the form-encoded SAML response.
2. Compares returned RelayState with the short-lived cookie.
3. Validates the SAML response through Node-SAML.
4. Checks the validated issuer and NameID.
5. Maps the configured identity attributes.
6. Retrieves or creates the corresponding application user.
7. Creates an application session JWT.
8. Sets the HTTP-only session cookie.
9. Redirects the browser to `/dashboard`.

### Session

The application session uses:

- JWT algorithm: HS256
- Issuer: `saml-sso-auth`
- Audience: `saml-sso-app`
- Cookie: `auth_session`
- Lifetime: 7 days
- HTTP-only: enabled
- Secure: enabled in production
- SameSite: Lax

### Logout

The local logout endpoint clears the application session cookie and temporary SAML login-state cookie.

It does not terminate the user's Identity Provider session.

## 8. API Reference

### Start SAML login

```http
GET /api/auth/saml/login
```

Starts SP-initiated authentication and redirects the browser to the Identity Provider.

### Assertion Consumer Service

```http
POST /api/auth/saml/acs
Content-Type: application/x-www-form-urlencoded
```

Receives:

```text
SAMLResponse=<base64-encoded-saml-response>
RelayState=<original-relay-state>
```

On success, the application creates a session and redirects to `/dashboard`.

### Get current user

```http
GET /api/auth/me
```

Successful response:

```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "Example User",
    "createdAt": "2026-01-01T10:00:00.000Z"
  }
}
```

Unauthenticated response:

```json
{
  "success": false,
  "error": "Not authenticated."
}
```

### Logout

```http
POST /api/auth/logout
```

Clears the local application cookies and redirects to `/login`.

This endpoint does not implement SAML Single Logout.

## 9. Security Considerations

### Signature validation

Use a trusted Identity Provider signing certificate.

Do not disable signature validation or accept unsigned assertions in production.

The application relies on Node-SAML for XML signature and protocol validation. Do not replace its validated profile with values extracted from untrusted raw XML.

### Issuer and audience

The expected Identity Provider issuer and Service Provider audience are configured explicitly.

Do not dynamically accept issuer or audience values from an untrusted request.

### Request correlation

The implementation enables `InResponseTo` validation and checks RelayState against a short-lived cookie.

Unsolicited IdP-initiated responses are not supported.

### Replay protection and deployment cache

The implementation enables assertion replay protection and request correlation.

**Important deployment limitation:** the default Node-SAML request and replay cache is in-memory. It is not shared across multiple Node.js processes, serverless instances, or horizontally scaled deployments.

For production deployments with multiple instances, configure a shared persistent Node-SAML cache provider backed by a suitable database or distributed store. Do not assume the in-memory cache provides cross-instance request correlation or replay protection.

### NameID stability

Use a persistent NameID format and ensure the Identity Provider sends a stable value.

Do not use email as a substitute for a stable external identity identifier unless your Identity Provider explicitly guarantees its stability and lifecycle.

### Session security

Use a strong, randomly generated `AUTH_SECRET`.

Keep session cookies HTTP-only and Secure in production.

### CSRF protection

The local logout endpoint is a state-changing POST route. Add an appropriate CSRF protection strategy before production use.

The SAML ACS route is a cross-site POST callback and uses SAML request correlation and RelayState validation. Do not apply ordinary same-origin form assumptions that would prevent the Identity Provider callback.

### Attribute trust

SAML attribute names vary between Identity Providers.

Configure the correct email and display-name attribute names. Only rely on an email attribute for account or authorization decisions if the trusted Identity Provider guarantees the attribute's verification and lifecycle semantics.

### Certificate rotation

Plan for Identity Provider signing certificate rotation. Obtain new certificates through a trusted administrative channel and update the application configuration deliberately.

### Single Logout

This implementation performs local application logout only.

SAML Single Logout requires additional protocol handling and is outside the scope of this template.

## 10. Production Checklist

Before deploying:

- [ ] Use HTTPS for application and Identity Provider endpoints.
- [ ] Configure the exact production SP Entity ID.
- [ ] Configure the exact production ACS URL.
- [ ] Register the application with the Identity Provider.
- [ ] Obtain the trusted IdP signing certificate.
- [ ] Require signed responses and assertions.
- [ ] Confirm issuer and audience configuration.
- [ ] Configure persistent NameID.
- [ ] Verify email and display-name attribute mappings.
- [ ] Generate a strong `AUTH_SECRET`.
- [ ] Keep private keys and secrets out of source control.
- [ ] Use a shared persistent Node-SAML cache for multi-instance deployments.
- [ ] Add CSRF protection to local logout.
- [ ] Test expired, malformed, replayed, and mismatched SAML responses.
- [ ] Test Identity Provider certificate rotation.
- [ ] Review authorization rules independently of authentication.

## Limitations

This reference implementation intentionally focuses on a single administrator-configured Identity Provider per application deployment.

It does not currently implement:

- Dynamic multi-tenant Identity Provider registration.
- Identity Provider metadata discovery.
- SAML Single Logout.
- Automatic account linking by email.
- A shared persistent Node-SAML request/replay cache.
- A tenant administration interface.
- Role and group synchronization.
- Automatic signing certificate rotation.
- A production-ready CSRF mechanism for local logout.
- A Service Provider metadata endpoint.

These capabilities can be added separately based on application requirements.

## License

Use and modify this boilerplate according to the license and terms of the repository in which it is distributed.
