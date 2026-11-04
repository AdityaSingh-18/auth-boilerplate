import type { ApiPayloadContract } from "@/types/auth";

export const microsoftOAuthApi: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/microsoft",
    method: "GET",
    description:
      "Starts the Microsoft OAuth sign-in flow. Generates OAuth state, an OIDC nonce, and PKCE values, stores them in temporary HTTP-only cookies, and redirects the browser to Microsoft.",
    response: {
      description:
        "Redirects the browser to the Microsoft authorization endpoint. Configuration errors redirect to the application's login page when APP_URL is configured.",
    },
  },
  {
    endpoint: "/api/auth/microsoft/callback",
    method: "GET",
    description:
      "Handles Microsoft's authorization response. Validates OAuth state, exchanges the authorization code, verifies the ID token and nonce, retrieves the Microsoft Graph profile, links or creates the application user, and creates the application session.",
    request: {
      description:
        "Microsoft redirects the browser to this endpoint with authorization response query parameters.",
      example: {
        code: "authorization_code",
        state: "returned_oauth_state",
      },
    },
    response: {
      description:
        "Redirects to the application home page after successful sign-in. Authentication failures redirect to the login page with an error query parameter.",
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Deletes the local application session cookie. It does not revoke Microsoft tokens or sign the user out of their Microsoft account.",
    response: {
      description: "Returns a success response after deleting the session.",
      example: {
        success: true,
      },
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Checks the application session and returns the authenticated user when a valid session exists.",
    response: {
      description: "Returns the current user when authenticated.",
      example: {
        user: {
          id: "user-uuid",
          email: "user@example.com",
          name: "Example User",
          image_url: null,
          email_verified: false,
        },
      },
    },
  },
];
