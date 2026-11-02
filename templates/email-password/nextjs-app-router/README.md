# Email & Password Authentication

A reusable email and password authentication implementation for Next.js App Router, with database integration through Neon PostgreSQL.

## Features

- Email and password registration
- Email and password login
- PBKDF2 password hashing using Web Crypto
- Stateless JWT sessions using `jose`
- HTTP-only session cookies
- Register, login, logout, and current-user API routes
- Neon PostgreSQL database adapter
- Optional reference authentication forms
- Separated core authentication logic and optional UI

## Requirements

- Next.js with App Router
- Node.js runtime
- Neon PostgreSQL account
- `jose`
- `@neondatabase/serverless`

Install the required packages:

```bash
pnpm add jose @neondatabase/serverless
```

## Environment Variables

Add these variables to your `.env.local` file:

```env
DATABASE_URL=your_neon_database_connection_string
AUTH_SECRET=your_random_secret_of_at_least_32_bytes
```

Generate an authentication secret:

```bash
openssl rand -base64 32
```

Keep these values private. Never expose them in client-side code or commit them to version control.

## Installation

### 1. Copy the authentication core

Copy the `core/lib/` directory into your Next.js project.

Keep the internal file structure intact:

```text
lib/
├── auth.ts
├── auth-db.ts
├── password.ts
└── session.ts
```

### 2. Add the API routes

Copy the route directories from `core/api/auth/` into your project's App Router API directory.

For a project using `src/`:

```text
src/app/api/auth/
├── register/
│   └── route.ts
├── login/
│   └── route.ts
├── logout/
│   └── route.ts
└── me/
    └── route.ts
```

For a project without `src/`, use `app/api/auth/` instead.

**Important:** Update the relative imports in the copied route files to point to the location where you placed the authentication library. The original relative imports are designed for the template's directory structure.

### 3. Install dependencies

```bash
pnpm add jose @neondatabase/serverless
```

### 4. Configure Neon PostgreSQL

1. Create a Neon project and database.
2. Copy your database connection string.
3. Add it as `DATABASE_URL` in `.env.local`.

### 5. Apply the database schema

The schema is located at:

```text
core/db/schema.sql
```

Open the Neon SQL Editor, paste the contents of `schema.sql`, and execute it.

This creates the `users` table required by the authentication adapter.

### 6. Configure the authentication secret

Add a strong random value as `AUTH_SECRET` in `.env.local`.

### 7. Add the optional UI

Optionally copy the files from `optional-ui/` into your project's components directory.

The UI is only a reference implementation. You can build your own interface using the API endpoints.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in a user |
| POST | `/api/auth/logout` | Log out the current user |
| GET | `/api/auth/me` | Get the current authenticated user |

### Register

Request:

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

Successful response (`201`):

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

An existing email returns `409 Conflict`.

### Login

Uses the same request shape as registration.

Successful response (`200`) returns the public user object.

Invalid credentials return `401 Unauthorized`.

### Logout

Successful response:

```json
{
  "message": "Logged out successfully."
}
```

### Current User

Successful response:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

Unauthenticated requests receive `401`.

## Database Integration

This implementation uses Neon PostgreSQL as its initial database integration.

The database adapter is located at:

```text
core/lib/auth-db.ts
```

It handles:

- Finding users by email
- Finding users by ID
- Creating users
- Storing password hashes

The database schema is located at:

```text
core/db/schema.sql
```

Apply this schema to your Neon database before using the authentication routes.

The adapter keeps database operations separate from authentication logic, making it possible to add other database integrations without rewriting the core authentication functions.

## Optional UI

The `optional-ui/` directory contains reference authentication forms for:

- User registration
- User login
- Checking the current session
- Logging out

You can use these components or build your own interface using the API endpoints.

The UI is optional and is not required for the authentication backend to work.

## Security Notes

- Passwords are hashed with PBKDF2 and a unique random salt.
- Password hashes are never returned in API responses.
- JWT sessions are stored in HTTP-only cookies.
- Cookies use `SameSite=Lax` and `Secure` in production.
- Configure a strong and private `AUTH_SECRET`.
- Add rate limiting to authentication endpoints.
- Review CSRF protection requirements for your deployment.
- Enforce unique email addresses at the database level.
- JWT logout clears the browser cookie. A copied token remains valid until it expires unless you add a revocation mechanism.

## Production Considerations

This template provides reusable authentication logic and a Neon PostgreSQL integration.

Before using it with real users, configure your production environment, review rate limiting and CSRF protections, and verify your database security and deployment settings.
