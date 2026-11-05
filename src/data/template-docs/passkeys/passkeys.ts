import type { TemplateDocumentation } from "@/types/auth";

export const passkeysDocumentation: TemplateDocumentation = {
  overview:
    "This template implements passwordless authentication using WebAuthn passkeys. It uses @simplewebauthn/server to generate registration and authentication options, verify authenticator responses, and validate credential public keys. Passkey credentials, public keys, authenticator counters, and short-lived challenges are stored in Neon PostgreSQL. Authenticated users can register passkeys for their existing accounts, while returning users can sign in using a registered passkey. Successful authentication creates a seven-day JWT session stored in an HTTP-only cookie. This template does not create user accounts; users must already exist in the application's user table.",

  files: [
    {
      path: "core/db/schema.sql",
      description:
        "Creates the users table (as a minimal example), passkey_credentials table, and passkey_challenges table. Includes credential ownership, authenticator metadata, challenge expiry, and one-time challenge consumption fields.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Provides Neon database access and functions for retrieving users, listing and storing passkeys, finding credentials, updating authenticator counters, and finding or consuming challenges.",
      required: true,
    },
    {
      path: "core/lib/passkey-challenge.ts",
      description:
        "Stores generated WebAuthn challenges in PostgreSQL with a five-minute expiry and their registration or authentication purpose.",
      required: true,
    },
    {
      path: "core/lib/passkey.ts",
      description:
        "Generates WebAuthn registration and authentication options, validates browser responses, verifies credential public keys, checks expected origins and relying-party IDs, and coordinates challenge and credential operations.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Provides current-user lookup through the session and creates a session after successful passkey authentication.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates, verifies, and deletes JWT-based authentication sessions using jose and an HTTP-only auth_session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/passkeys/register/options/route.ts",
      description:
        "Requires an authenticated user and generates registration options for adding a passkey to that user's existing account.",
      required: true,
    },
    {
      path: "core/api/auth/passkeys/register/verify/route.ts",
      description:
        "Requires an authenticated user and verifies the browser's passkey registration response before storing the credential.",
      required: true,
    },
    {
      path: "core/api/auth/passkeys/authenticate/options/route.ts",
      description:
        "Generates authentication options and stores a short-lived authentication challenge for a sign-in attempt.",
      required: true,
    },
    {
      path: "core/api/auth/passkeys/authenticate/verify/route.ts",
      description:
        "Verifies a passkey assertion, consumes its challenge, updates the authenticator counter, and creates an authenticated session.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description:
        "Deletes the current authentication session cookie.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Returns the currently authenticated user, or null when no valid session exists.",
      required: true,
    },
    {
      path: "optional-ui/PasskeyAuth.tsx",
      description:
        "Optional client-side UI for registering a passkey and signing in with a passkey using @simplewebauthn/browser.",
      required: false,
    },
    {
      path: ".env.example",
      description:
        "Documents the database connection, session secret, WebAuthn relying-party name, relying-party ID, and allowed origin.",
      required: true,
    },
    {
      path: "README.md",
      description:
        "Explains installation, environment configuration, database setup, relying-party configuration, API endpoints, integration, and security considerations.",
      required: true,
    },
  ],

  functions: [
    {
      name: "createRegistrationOptions",
      description:
        "Generates WebAuthn registration options for an existing authenticated user, excludes credentials already registered to that user, and saves the generated challenge.",
      signature:
        "createRegistrationOptions(user: { id: string; email: string | null; name: string | null })",
      example:
        "const options = await createRegistrationOptions(user);",
    },
    {
      name: "verifyRegistration",
      description:
        "Checks the stored registration challenge, verifies the authenticator response against the configured origin and relying-party ID, consumes the challenge, and stores the new credential.",
      signature:
        "verifyRegistration(userId: string, response: RegistrationResponseJSON)",
      example:
        "const result = await verifyRegistration(user.id, response);",
    },
    {
      name: "createAuthenticationOptions",
      description:
        "Generates WebAuthn authentication options and stores the challenge for a passwordless sign-in attempt.",
      signature: "createAuthenticationOptions()",
      example:
        "const options = await createAuthenticationOptions();",
    },
    {
      name: "verifyAuthentication",
      description:
        "Finds the stored credential, verifies the authenticator assertion and challenge, consumes the challenge, updates the credential counter, and returns the associated user ID.",
      signature:
        "verifyAuthentication(response: AuthenticationResponseJSON)",
      example:
        "const result = await verifyAuthentication(response);",
    },
    {
      name: "getCurrentUser",
      description:
        "Reads the current session and retrieves the corresponding user from the database.",
      signature: "getCurrentUser()",
      example: "const user = await getCurrentUser();",
    },
    {
      name: "signInWithPasskey",
      description:
        "Creates a JWT authentication session for the user whose passkey was successfully verified.",
      signature: "signInWithPasskey(userId: string)",
      example: "await signInWithPasskey(userId);",
    },
    {
      name: "saveChallenge",
      description:
        "Stores a WebAuthn challenge with its purpose, optional user ID, and five-minute expiry.",
      signature:
        'saveChallenge(challenge: string, purpose: "registration" | "authentication", userId: string | null)',
      example:
        'await saveChallenge(options.challenge, "registration", user.id);',
    },
    {
      name: "consumeChallenge",
      description:
        "Atomically marks an unexpired, unused challenge as consumed. Only one request can successfully consume the same challenge.",
      signature:
        'consumeChallenge(challenge: string, purpose: "registration" | "authentication")',
      example:
        'const consumed = await consumeChallenge(challenge, "authentication");',
    },
    {
      name: "getUserPasskeys",
      description:
        "Retrieves all passkey credentials registered to a user.",
      signature: "getUserPasskeys(userId: string)",
      example:
        "const credentials = await getUserPasskeys(user.id);",
    },
    {
      name: "storePasskey",
      description:
        "Stores a verified passkey credential, its public key, authenticator counter, transports, device type, and backup state.",
      signature:
        "storePasskey(input: { credentialId: string; userId: string; publicKey: Uint8Array; counter: number; transports?: string[]; deviceType?: string; backedUp?: boolean })",
      example:
        "await storePasskey({ credentialId, userId, publicKey, counter });",
    },
    {
      name: "createSession",
      description:
        "Creates a signed JWT session and stores it in an HTTP-only cookie.",
      signature: "createSession(userId: string)",
      example: "await createSession(user.id);",
    },
  ],

  environmentVariables: [
    {
      name: "DATABASE_URL",
      description:
        "Neon PostgreSQL connection string used to store users, passkey credentials, and WebAuthn challenges.",
      required: true,
      example:
        "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require",
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign and verify JWT authentication sessions. Must contain at least 32 bytes of secret material.",
      required: true,
      example: "Generate with: openssl rand -base64 32",
    },
    {
      name: "RP_NAME",
      description:
        "Human-readable relying-party name displayed by the browser or authenticator during passkey operations.",
      required: true,
      example: "My Application",
    },
    {
      name: "RP_ID",
      description:
        "WebAuthn relying-party ID. Usually the application's hostname, without a protocol or path. Must be compatible with RP_ORIGIN.",
      required: true,
      example: "localhost",
    },
    {
      name: "RP_ORIGIN",
      description:
        "Exact origin expected during WebAuthn verification. Use HTTPS outside localhost.",
      required: true,
      example: "http://localhost:3000",
    },
  ],

  securityNotes: [
    {
      title: "WebAuthn response verification",
      description:
        "Registration and authentication responses are verified with @simplewebauthn/server. Verification checks the expected challenge, origin, relying-party ID, and authenticator response before accepting a credential or signing in.",
    },
    {
      title: "Challenge expiry and single use",
      description:
        "Challenges expire after five minutes. A conditional database update marks a challenge as consumed, preventing successful reuse of the same challenge.",
    },
    {
      title: "Authenticated registration",
      description:
        "Registering a passkey requires an existing authenticated user. The registration verification route checks the current session and associates the credential with that user.",
    },
    {
      title: "Credential public key storage",
      description:
        "The authenticator's public key is stored in the database. Authentication verifies signatures using the stored public key; the private key remains with the authenticator.",
    },
    {
      title: "Session cookie protection",
      description:
        "Authentication sessions use a signed JWT in an HTTP-only cookie with a seven-day lifetime, SameSite=Lax, and Secure enabled in production.",
    },
    {
      title: "Authenticator counter",
      description:
        "The stored authenticator counter is checked and updated after successful assertion verification. Counter updates should use conditional database writes to avoid concurrent overwrites.",
    },
    {
      title: "Transaction handling",
      description:
        "Challenge consumption and credential persistence or counter updates are separate database operations in this implementation. A failure between these operations can consume a challenge without completing the corresponding database change. Consider transactional database operations for production use.",
    },
    {
      title: "Relying-party configuration",
      description:
        "RP_ID and RP_ORIGIN must be configured correctly for the deployment domain. WebAuthn requires HTTPS outside localhost, and an origin must be valid for the configured relying-party ID.",
    },
    {
      title: "Existing user model",
      description:
        "The included users table is a minimal example. Adapt it to the application's existing user model before integration. This template does not provide user registration or account recovery.",
    },
  ],
};
