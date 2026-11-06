import type { TemplateDocumentation } from "@/types/auth";

export const samlSsoDocumentation: TemplateDocumentation = {
  overview:
    "A SAML 2.0 Service Provider-initiated Single Sign-On implementation for Next.js App Router. It uses a configured Identity Provider, validates signed SAML responses and assertions with @node-saml/node-saml, maps identity attributes, stores external identities in Neon PostgreSQL, and creates an application session using a signed JWT cookie.",

  files: [
    {
      path: "core/db/schema.sql",
      description:
        "Creates the users and saml_accounts tables. External SAML identities are uniquely identified by the Identity Provider issuer and NameID.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Retrieves the current authenticated user from the application session cookie.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Provides database operations for finding users, retrieving SAML identities, and creating users linked to external SAML accounts.",
      required: true,
    },
    {
      path: "core/lib/saml-config.ts",
      description:
        "Loads and validates the administrator-configured Service Provider and Identity Provider settings and creates the Node-SAML client.",
      required: true,
    },
    {
      path: "core/lib/saml-request.ts",
      description:
        "Creates a cryptographically random RelayState and prepares an authorization request for the configured Identity Provider.",
      required: true,
    },
    {
      path: "core/lib/saml-response.ts",
      description:
        "Validates the SAML response through Node-SAML and maps the verified issuer, NameID, email, and display-name attributes.",
      required: true,
    },
    {
      path: "core/lib/session.ts",
      description:
        "Creates and verifies application session JWTs and defines the HTTP-only session cookie settings.",
      required: true,
    },
    {
      path: "core/api/auth/saml/login/route.ts",
      description:
        "Starts Service Provider-initiated SAML authentication and redirects the user to the configured Identity Provider.",
      required: true,
    },
    {
      path: "core/api/auth/saml/acs/route.ts",
      description:
        "Handles the SAML Assertion Consumer Service POST callback, checks RelayState, validates the SAML response, retrieves or creates the user, and issues the application session.",
      required: true,
    },
    {
      path: "core/api/auth/logout/route.ts",
      description:
        "Clears the local application session and temporary SAML login-state cookie. It does not perform Identity Provider Single Logout.",
      required: true,
    },
    {
      path: "core/api/auth/me/route.ts",
      description:
        "Returns the currently authenticated user's application profile.",
      required: true,
    },
    {
      path: "optional-ui/SamlSignIn.tsx",
      description:
        "Optional client-side sign-in component for starting SAML authentication and displaying the current user.",
      required: false,
    },
    {
      path: ".env.example",
      description:
        "Documents the required database, session, Service Provider, Identity Provider, and SAML attribute configuration.",
      required: true,
    },
    {
      path: "README.md",
      description:
        "Explains installation, Identity Provider setup, environment configuration, database initialization, route integration, API behavior, and security considerations.",
      required: true,
    },
  ],

  functions: [
    {
      name: "getCurrentUser",
      description:
        "Reads and verifies the application session cookie, then retrieves the corresponding user from the database.",
      signature: "getCurrentUser(): Promise<SamlUser | null>",
    },
    {
      name: "findUserBySamlIdentity",
      description:
        "Finds an application user using the external Identity Provider issuer and SAML NameID.",
      signature:
        "findUserBySamlIdentity(idpIssuer: string, nameId: string): Promise<SamlUser | null>",
    },
    {
      name: "getOrCreateSamlUser",
      description:
        "Retrieves an existing user or creates a new user and links the verified external SAML identity. It does not automatically link accounts by email.",
      signature:
        "getOrCreateSamlUser(input: SamlIdentityInput): Promise<SamlUser>",
    },
    {
      name: "getSamlClient",
      description:
        "Creates and returns the configured Node-SAML client used for SAML authentication requests and response validation.",
      signature: "getSamlClient(): SAML",
    },
    {
      name: "createSamlAuthorizationRequest",
      description:
        "Generates a random RelayState and creates the authorization URL for the configured Identity Provider.",
      signature:
        "createSamlAuthorizationRequest(): Promise<SamlAuthorizationRequest>",
    },
    {
      name: "validateSamlResponse",
      description:
        "Validates the posted SAML response using Node-SAML and returns the mapped identity profile.",
      signature:
        "validateSamlResponse(samlResponse: string): Promise<VerifiedSamlIdentity>",
    },
    {
      name: "createSessionToken",
      description:
        "Creates a signed JWT application session for the authenticated user.",
      signature: "createSessionToken(user: SamlUser): Promise<string>",
    },
    {
      name: "verifySessionToken",
      description:
        "Verifies the application session JWT signature, issuer, audience, and expiration.",
      signature:
        "verifySessionToken(token: string): Promise<SessionPayload | null>",
    },
  ],

  environmentVariables: [
    {
      name: "DATABASE_URL",
      description:
        "Neon PostgreSQL connection string used by the authentication database.",
      required: true,
      example:
        "postgresql://<username>:<password>@<host>/<database>?sslmode=require",
    },
    {
      name: "AUTH_SECRET",
      description:
        "Secret used to sign application session JWTs. Must contain at least 32 bytes.",
      required: true,
      example: "<your-auth-secret-minimum-32-bytes>",
    },
    {
      name: "APP_URL",
      description:
        "Public base URL of the application, used to construct authentication redirects.",
      required: true,
      example: "http://localhost:3000",
    },
    {
      name: "SAML_SP_ENTITY_ID",
      description:
        "Stable Service Provider entity ID registered with the Identity Provider.",
      required: true,
      example: "http://localhost:3000/saml/metadata",
    },
    {
      name: "SAML_ACS_URL",
      description:
        "Assertion Consumer Service URL registered with the Identity Provider.",
      required: true,
      example: "http://localhost:3000/api/auth/saml/acs",
    },
    {
      name: "SAML_IDP_ENTRY_POINT",
      description:
        "Identity Provider SSO endpoint that receives authentication requests.",
      required: true,
      example: "https://<your-idp-domain>/sso/saml",
    },
    {
      name: "SAML_IDP_ISSUER",
      description:
        "Expected Identity Provider entity ID. The returned issuer must match this value.",
      required: true,
      example: "https://<your-idp-domain>/entity",
    },
    {
      name: "SAML_IDP_CERT",
      description:
        "Trusted Identity Provider signing certificate in PEM format, used to validate SAML signatures.",
      required: true,
      example: "-----BEGIN CERTIFICATE-----\\n<your-idp-certificate>\\n-----END CERTIFICATE-----",
    },
    {
      name: "SAML_SP_PRIVATE_KEY",
      description:
        "Optional Service Provider private key used when the Identity Provider requires signed authentication requests.",
      required: false,
      example: "-----BEGIN PRIVATE KEY-----\\n<your-sp-private-key>\\n-----END PRIVATE KEY-----",
    },
    {
      name: "SAML_SP_PUBLIC_CERT",
      description:
        "Optional Service Provider public certificate paired with SAML_SP_PRIVATE_KEY.",
      required: false,
      example: "-----BEGIN CERTIFICATE-----\\n<your-sp-public-certificate>\\n-----END CERTIFICATE-----",
    },
    {
      name: "SAML_EMAIL_ATTRIBUTE",
      description:
        "Identity Provider attribute name mapped to the user's email address.",
      required: false,
      example: "email",
    },
    {
      name: "SAML_NAME_ATTRIBUTE",
      description:
        "Identity Provider attribute name mapped to the user's display name.",
      required: false,
      example: "displayName",
    },
  ],

  securityNotes: [
    {
      title: "Administrator-configured Identity Provider",
      description:
        "The Identity Provider entry point, issuer, and signing certificate are configured by the application administrator. The implementation does not accept arbitrary Identity Provider URLs from end users.",
    },
    {
      title: "SAML signature verification",
      description:
        "SAML responses and assertions are configured to require signatures. Node-SAML performs signature and protocol validation; application code should use the validated profile rather than parsing raw SAML XML.",
    },
    {
      title: "Issuer and audience validation",
      description:
        "The expected Identity Provider issuer and Service Provider audience are configured explicitly. The response must match the configured authentication context.",
    },
    {
      title: "Request correlation and replay protection",
      description:
        "The implementation requires InResponseTo validation, checks RelayState against a short-lived cookie, and enables assertion replay protection. The default Node-SAML cache is in-memory, so production deployments with multiple instances require a shared persistent cache provider.",
    },
    {
      title: "Account linking",
      description:
        "External accounts are identified by the combination of Identity Provider issuer and NameID. Email is stored as a profile attribute and is not used to automatically merge accounts.",
    },
    {
      title: "Persistent NameID",
      description:
        "Configure the Identity Provider to issue a stable, persistent NameID. Transient or changing NameID values can cause the same person to be treated as a different external account.",
    },
    {
      title: "Session cookie protection",
      description:
        "The application session is stored in an HTTP-only cookie with Secure enabled in production, SameSite=Lax, and a seven-day expiration.",
    },
    {
      title: "Identity Provider trust",
      description:
        "The configured signing certificate must be obtained from a trusted administrative source and rotated when the Identity Provider changes its signing certificate. Email attributes should only be trusted according to the configured Identity Provider's guarantees.",
    },
    {
      title: "No Single Logout",
      description:
        "The logout endpoint clears the local application session only. It does not terminate the user's Identity Provider session or implement SAML Single Logout.",
    },
  ],
};
