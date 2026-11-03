# Phone & Password Authentication

A reusable phone number and password authentication implementation for **Next.js App Router** using Neon PostgreSQL.

## Features

- Phone number normalization and validation using E.164 format
- Password hashing using PBKDF2 with SHA-256
- Stateless JWT sessions using `jose`
- HTTP-only session cookies
- User registration, login, logout, and current-user endpoints
- Neon PostgreSQL database adapter
- Optional reference authentication form

## Tech Stack

- Next.js App Router
- TypeScript
- Neon PostgreSQL
- `@neondatabase/serverless`
- `libphonenumber-js`
- `jose`
- Node.js Crypto

## Requirements

- Node.js
- A Next.js App Router project
- A Neon PostgreSQL database

## Installation

Install the required dependencies:

```bash
pnpm add @neondatabase/serverless libphonenumber-js jose
```

## Environment Variables

Copy `.env.example` to `.env.local` in your Next.js project root.

```env
DATABASE_URL="your_neon_database_connection_string"
AUTH_SECRET="replace_with_a_random_secret_at_least_32_characters_long"
```

Generate a secure authentication secret:

```bash
openssl rand -base64 32
```

Never commit `.env.local` or expose `AUTH_SECRET` to client-side code.

## Database Setup

1. Create a Neon PostgreSQL project.
2. Copy your database connection string into `DATABASE_URL`.
3. Open the Neon SQL Editor.
4. Execute the SQL in `core/db/schema.sql`.

The users table stores:

- `id`: Unique user identifier
- `phone`: Normalized E.164 phone number with a unique constraint
- `password_hash`: PBKDF2 password hash
- `created_at`: Account creation timestamp

## Integration

Copy the contents of `core/lib/` into your project's `src/lib/` directory.

Copy the contents of `core/api/auth/` into:

```text
src/app/api/auth/
├── register/route.ts
├── login/route.ts
├── logout/route.ts
└── me/route.ts
```

**Important:** Update the relative imports in the API route files after copying them. For a project using the `src/` directory, you can use imports such as:

```ts
import { registerUser } from "@/lib/auth";
```

Copy `optional-ui/AuthForm.tsx` into your components directory if you want to use the reference form.

Example:

```tsx
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return <AuthForm />;
}
```

## Phone Number Format

Phone numbers are normalized and validated using `libphonenumber-js`.

The implementation stores phone numbers in E.164 format.

Example:

```text
Input:  +91 98765 43210
Stored: +919876543210
```

International phone numbers should include their country calling code.

The current implementation does not provide a default country for national-format numbers.

**Important:** Phone number validation does not verify ownership. SMS OTP verification is not included in this template.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/auth/logout` | Clear the session cookie |
| GET | `/api/auth/me` | Retrieve the current user |

### Registration

Request:

```json
{
  "phone": "+919876543210",
  "password": "your_secure_password"
}
```

Successful response: `201 Created`

Duplicate phone number: `409 Conflict`

### Login

Request:

```json
{
  "phone": "+919876543210",
  "password": "your_secure_password"
}
```

Successful response: `200 OK`

Invalid credentials: `401 Unauthorized`

### Logout

Send a POST request to `/api/auth/logout`.

The session cookie is cleared.

### Current User

Send a GET request to `/api/auth/me`.

Returns the authenticated user's public information.

## Security Notes

- Passwords are hashed using PBKDF2 with SHA-256, 310,000 iterations, and a unique random salt.
- Password verification uses constant-time comparison.
- Sessions use signed JWTs with a seven-day expiration.
- Session cookies are HTTP-only and use `Secure` in production.
- Password hashes are never returned by the authentication API.
- Phone numbers are normalized before database operations.
- The database enforces phone number uniqueness.

Before production deployment, consider adding:

- Rate limiting for registration and login
- CSRF and request-origin protections
- Phone ownership verification through SMS OTP
- Session revocation or token rotation
- HTTPS in production
- Monitoring and authentication event logging

## Limitations

This template implements phone number and password authentication only. It does not include SMS OTP, password recovery, or phone number change verification.

## License

Use and modify this boilerplate according to your project's license and requirements.
