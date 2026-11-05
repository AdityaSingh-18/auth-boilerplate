import type { ApiPayloadContract } from "@/types/auth";

export const guestLoginApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/guest",
    method: "POST",
    description:
      "Creates a guest account and establishes an authentication session. If a valid session already exists, the existing user is returned instead of creating another guest account.",
    request: {
      description:
        "No request fields are required to start a guest session.",
      example: {},
    },
    response: {
      description:
        "Returns the guest user associated with the newly created or existing session.",
      example: {
        success: true,
        user: {
          id: "user_123",
          isGuest: true,
        },
      },
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Verifies the current authentication session and returns the authenticated user's public information.",
    response: {
      description:
        "Returns the current user's ID, guest status, and creation timestamp.",
      example: {
        success: true,
        user: {
          id: "user_123",
          isGuest: true,
          createdAt: "2026-01-01T10:00:00.000Z",
        },
      },
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Clears the authentication session cookie and logs out the current browser session.",
    response: {
      description:
        "Confirms that the browser session has been cleared.",
      example: {
        success: true,
        message: "Logged out successfully",
      },
    },
  },
];
