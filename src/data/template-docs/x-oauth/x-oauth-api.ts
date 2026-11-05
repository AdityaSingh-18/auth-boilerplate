import type { ApiPayloadContract } from "@/types/auth";

export const xOAuthApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/x",
    method: "GET",
    description:
      "Starts X OAuth 2.0 authentication. Generates OAuth state and PKCE values, stores them in HTTP-only cookies, and redirects the user to X.",
    response: {
      description:
        "Redirects the browser to the X authorization page.",
    },
  },
  {
    endpoint: "/api/auth/x/callback",
    method: "GET",
    description:
      "Handles the X OAuth callback. Validates the state, exchanges the authorization code using the stored PKCE verifier, retrieves the X profile, and creates an application session.",
    response: {
      description:
        "Redirects the user to the application after successful authentication, or to the login page with an error query parameter if authentication fails.",
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Clears the current authentication session cookie.",
    response: {
      description: "Indicates that the logout operation succeeded.",
      example: {
        success: true,
      },
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Retrieves the currently authenticated user from the session JWT.",
    response: {
      description:
        "Returns the authenticated user or null when no valid session exists.",
      example: {
        user: {
          id: "user-uuid",
          email: null,
          name: "Example User",
          imageUrl: "https://example.com/profile.jpg",
          emailVerified: false,
        },
      },
    },
  },
];
