import type { ApiPayloadContract } from "@/types/auth";

export const oidcSsoApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/oidc/start",
    method: "POST",
    description:
      "Starts organization-based OIDC authentication. Accepts a work email address, resolves its enabled tenant, generates state, nonce, and PKCE values, stores temporary flow cookies, and returns the provider authorization URL.",
    request: {
      description: "Work email address used to identify the organization.",
      example: {
        email: "user@example.com",
      },
      typeDefinition: `type OidcStartRequest = {
  email: string;
};`,
    },
    response: {
      description:
        "Returns the authorization URL that the browser must visit to authenticate with the organization's identity provider.",
      example: {
        success: true,
        authorizationUrl:
          "https://identity.example.com/authorize?client_id=your-client-id&response_type=code&scope=openid%20profile%20email&state=generated-state&nonce=generated-nonce&code_challenge=generated-challenge&code_challenge_method=S256",
      },
      typeDefinition: `type OidcStartResponse = {
  success: true;
  authorizationUrl: string;
};

type OidcStartErrorResponse = {
  success: false;
  error: string;
};`,
    },
  },
  {
    endpoint: "/api/auth/oidc/callback",
    method: "GET",
    description:
      "Handles the identity provider's authorization callback. Validates state and temporary cookies, exchanges the authorization code, verifies the ID token, resolves the application user, creates a session, clears temporary flow cookies, and redirects to the login page.",
    request: {
      description:
        "The identity provider redirects the browser with an authorization code and the original state value. Provider error responses may contain an error parameter instead.",
      example: {
        code: "authorization-code-from-provider",
        state: "original-generated-state",
      },
      typeDefinition: `type OidcCallbackQuery = {
  code?: string;
  state?: string;
  error?: string;
};`,
    },
    response: {
      description:
        "Does not return a JSON response. Redirects the browser to /login after processing the callback. On failure, includes an error query parameter.",
      example: {
        successRedirect: "http://localhost:3000/login",
        failureRedirect:
          "http://localhost:3000/login?error=oidc_sign_in_failed",
      },
      typeDefinition: `// Successful callback:
// HTTP 303 redirect to /login

// Failed callback:
// HTTP 303 redirect to /login?error=oidc_sign_in_failed

// Other failure codes used by the callback:
// invalid_oidc_callback
// identity_provider_error`,
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Verifies the application session cookie and retrieves the corresponding user record from the database.",
    response: {
      description:
        "Returns the authenticated application user when a valid session exists.",
      example: {
        success: true,
        user: {
          id: "user-uuid",
          email: "user@example.com",
          name: "Example User",
          imageUrl: null,
          createdAt: "2026-01-01T10:00:00.000Z",
        },
      },
      typeDefinition: `type OidcCurrentUserResponse = {
  success: true;
  user: {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    createdAt: string;
  };
};

type OidcUnauthenticatedResponse = {
  success: false;
  error: "Not authenticated";
};`,
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Deletes the application session cookie and signs the user out of the current application session. It does not perform provider-side logout or revoke an already copied JWT.",
    response: {
      description: "Confirms that the application session cookie was cleared.",
      example: {
        success: true,
        message: "Logged out successfully",
      },
      typeDefinition: `type OidcLogoutResponse = {
  success: true;
  message: string;
};`,
    },
  },
];
