import type { ApiPayloadContract } from "@/types/auth";

export const emailPasswordApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/register",
    method: "POST",
    description:
      "Registers a new user with an email address and password, then returns the created user's public information.",
    request: {
      description: "Registration credentials.",
      example: {
        email: "user@example.com",
        password: "StrongPassword123!",
      },
    },
    response: {
      description: "Returns the newly created user's public information.",
      example: {
        user: {
          id: "user_123",
          email: "user@example.com",
        },
      },
    },
  },
  {
    endpoint: "/api/auth/login",
    method: "POST",
    description:
      "Authenticates an existing user with their email address and password and establishes an authentication session.",
    request: {
      description: "User login credentials.",
      example: {
        email: "user@example.com",
        password: "StrongPassword123!",
      },
    },
    response: {
      description:
        "Returns the authenticated user's public information.",
      example: {
        user: {
          id: "user_123",
          email: "user@example.com",
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
      description: "Confirms that the browser session has been cleared.",
      example: {
        message: "Logged out successfully.",
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
        "Returns the current authenticated user's public information.",
      example: {
        user: {
          id: "user_123",
          email: "user@example.com",
        },
      },
    },
  },
];
