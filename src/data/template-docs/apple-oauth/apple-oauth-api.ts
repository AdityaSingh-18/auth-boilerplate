import type { ApiPayloadContract } from "@/types/auth";

export const appleOAuthApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/apple",
    method: "GET",
    description:
      "Starts the Apple OAuth authorization flow. Generates state and nonce values, stores them in temporary cookies, and redirects the user to Apple's authorization page.",
    response: {
      description:
        "Redirects the browser to Apple's authorization endpoint. This endpoint does not return a JSON response.",
    },
  },
  {
    endpoint: "/api/auth/apple/callback",
    method: "POST",
    description:
      "Handles Apple's form_post authorization callback. Validates the returned state, exchanges the authorization code, verifies the Apple ID token, resolves the application user, and establishes an application session.",
    request: {
      description:
        "Apple submits an application/x-www-form-urlencoded form containing the authorization response. The form may include code, state, error, and user fields.",
      example: {
        code: "apple_authorization_code",
        state: "returned_oauth_state",
        user: "{\"name\":{\"firstName\":\"Example\",\"lastName\":\"User\"},\"email\":\"user@example.com\"}",
      },
    },
    response: {
      description:
        "Redirects the browser to the application after successful authentication. On failure, redirects to the login page with an error query parameter.",
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Deletes the current application session cookie.",
    response: {
      description: "Returns a success response after clearing the session.",
      example: {
        success: true,
      },
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Returns the currently authenticated application user using the session cookie.",
    response: {
      description: "Returns the authenticated user when a valid session exists.",
      example: {
        user: {
          id: "user-uuid",
          email: "user@example.com",
          name: "Example User",
          image_url: null,
          email_verified: true,
        },
      },
    },
  },
];
