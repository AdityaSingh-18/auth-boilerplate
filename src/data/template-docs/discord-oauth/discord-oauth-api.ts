import type { ApiPayloadContract } from "@/types/auth";

export const discordOAuthApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/discord",
    method: "GET",
    description:
      "Starts Discord OAuth2 authentication. Generates an OAuth state value, stores it in an HTTP-only cookie, and redirects the user to Discord's authorization page.",
    response: {
      description:
        "Redirects the browser to Discord's OAuth2 authorization endpoint. No JSON response is returned.",
    },
  },
  {
    endpoint: "/api/auth/discord/callback",
    method: "GET",
    description:
      "Handles the Discord OAuth2 callback. Validates the state, exchanges the authorization code, retrieves the Discord profile, finds or creates the application user, links the Discord account, and establishes an application session.",
    request: {
      description:
        "Discord redirects the browser to this endpoint with OAuth query parameters.",
      example: {
        code: "authorization_code_from_discord",
        state: "returned_oauth_state",
      },
    },
    response: {
      description:
        "On successful authentication, redirects the user to the application homepage and sets the application session cookie. On failure, redirects to the login page with an authentication error query parameter.",
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Deletes the current application session cookie.",
    response: {
      description: "Returns a JSON response confirming local sign-out.",
      example: {
        success: true,
      },
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Returns the currently authenticated application user based on the session cookie.",
    response: {
      description:
        "Returns the authenticated user when a valid session exists.",
      example: {
        user: {
          id: "user-id",
          email: "user@example.com",
          name: "Discord User",
          image_url: "https://cdn.discordapp.com/avatars/...",
          email_verified: true,
        },
      },
    },
  },
];
