# Username & Password Authentication

A reusable username and password authentication boilerplate for Next.js App Router.

This template includes:

- Username normalization and validation
- Case-insensitive username uniqueness
- Password hashing with Web Crypto PBKDF2
- Stateless JWT sessions using `jose`
- HTTP-only session cookies
- Neon PostgreSQL database adapter
- Register, login, logout, and current-user API routes
- Optional reference authentication UI

## Tech Stack

- Next.js App Router
- TypeScript
- Neon PostgreSQL
- `@neondatabase/serverless`
- `jose`
- Web Crypto API

## Requirements

- Node.js
- A Next.js App Router project
- A Neon PostgreSQL database

## Installation

Install the required dependencies:

```bash
pnpm add jose @neondatabase/serverless
```

Copy the `core/lib` directory into your project's `src/lib` directory.

Copy the contents of `core/api/auth` into:

```text
src/app/api/auth/
```

Copy the optional UI component into your preferred components directory.

If your project does not use the `src` directory, adjust the destination paths accordingly.

**Import paths:** After copying the API routes into `src/app/api/auth/`, update their imports to point to `src/lib`. You can use your project's `@/lib/...` alias.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure the variables:

```env
DATABASE_URL="your_neon_database_connection_string"
AUTH_SECRET="your_random_secret_at_least_32_characters_long"
```

Generate a secret with:

```bash
openssl rand -base64 32
```

Never commit `.env.local` or expose `AUTH_SECRET` to the browser.

## Database Setup

Open your Neon SQL Editor and execute the contents of:

```text
core/db/schema.sql
```

This creates the `users` table with a unique username constraint.

Usernames are stored in normalized lowercase form.

## Username Rules

- Minimum length: 3 characters
- Maximum length: 30 characters
- Allowed characters: lowercase letters, numbers, and underscores
- Leading and trailing whitespace is removed
- Usernames are converted to lowercase before registration and login

For example, `John_Doe`, `john_doe`, and `JOHN_DOE` resolve to the same username.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get current user |

### Register

**Request:**

```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Successful response:** `201 Created`

```json
{
  "user": {
    "id": "user-id",
    "username": "john_doe"
  }
}
```

A duplicate username returns `409 Conflict`.

### Login

**Request:**

```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

Invalid credentials return `401 Unauthorized`.

### Logout

Send a POST request to `/api/auth/logout`.

The session cookie is cleared.

### Current User

Send a GET request to `/api/auth/me`.

An unauthenticated request returns `401 Unauthorized`.

## Security Notes

- Passwords are hashed using PBKDF2 with SHA-256 and a unique random salt.
- Password hashes are never included in API responses.
- Sessions use signed JWTs stored in HTTP-only cookies.
- Cookies use `Secure` in production and `SameSite=Lax`.
- Database queries use parameterized Neon SQL templates.
- Username uniqueness is enforced by the database.

Before production use, add rate limiting, review CSRF and origin protections for your deployment, and consider session revocation. Clearing the cookie on logout does not invalidate a previously copied JWT before its expiry.