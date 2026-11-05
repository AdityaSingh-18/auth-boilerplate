import type { ApiPayloadContract } from "@/types/auth";

export const facebookOAuthApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/facebook",
    method: "GET",
    description:
      "Starts Facebook OAuth authentication. Generates a random state value, stores it in an HTTP-only cookie, and redirects the browser to Facebook's authorization page.",
    response: {
      description:
        "Redirects the browser to Facebook's OAuth authorization URL. On configuration failure, redirects to /login?error=facebook_configuration_error.",
    },
  },
  {
    endpoint: "/api/auth/facebook/callback",
    method: "GET",
    description:
      "Handles the Facebook OAuth callback. Validates the returned state against the stored cookie, exchanges the authorization code, retrieves the Facebook profile, creates or retrieves the application user, and establishes a session.",
    response: {
      description:
        "On success, redirects to the application home page. On failure, redirects to the login page with an error query parameter.",
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Clears the current authentication session cookie.",
    response: {
      description: "Returns a JSON confirmation after clearing the session cookie.",
      example: {
        success: true,
        message: "Signed out successfully.",
      },
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Checks the current session and returns the authenticated application user.",
    response: {
      description:
        "Returns the authenticated user when a valid session exists. Returns HTTP 401 when the session is missing or invalid.",
      example: {
        user: {
          id: "user-uuid",
          email: "user@example.com",
          name: "Example User",
          image_url: "https://example.com/profile.jpg",
          email_verified: false,
        },
      },
    },
  },
];
