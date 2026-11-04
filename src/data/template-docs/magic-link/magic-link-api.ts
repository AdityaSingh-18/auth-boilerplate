import type { ApiPayloadContract } from "@/types/auth";

export const magicLinkApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/request-link",
    method: "POST",
    description:
      "Requests a single-use magic link to be sent to the supplied email address.",
    request: {
      description:
        "Provide the email address that should receive the magic link.",
      example: {
        email: "user@example.com",
      },
    },
    response: {
      description:
        "Generic response confirming that the magic-link request was processed.",
      example: {
        message: "If the request is valid, a sign-in link will be sent.",
      },
    },
  },
  {
    endpoint: "/api/auth/callback",
    method: "GET",
    description:
      "Verifies the signed magic-link token, consumes it once, creates or retrieves the user, and establishes an authenticated session.",
    request: {
      description:
        "The signed magic-link token is supplied as a query parameter in the callback URL.",
      example: {
        token: "signed_magic_link_token",
      },
    },
    response: {
      description:
        "Redirects to the application after successful authentication or to the login page if the link is invalid or expired.",
      example: {
        successRedirect: "/",
        errorRedirect: "/login?error=invalid_or_expired_link",
      },
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Logs out the current user by clearing the authentication session cookie.",
    response: {
      description: "Confirms that the session cookie was cleared.",
      example: {
        message: "Logged out successfully.",
      },
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Retrieves the currently authenticated user's public information.",
    response: {
      description:
        "Returns the authenticated user when a valid session exists.",
      example: {
        user: {
          id: "user_123",
          email: "user@example.com",
        },
      },
    },
  },
];
