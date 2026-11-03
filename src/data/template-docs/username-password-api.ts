import type { ApiPayloadContract } from "@/types/auth";

export const usernamePasswordApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/register",
    method: "POST",
    description:
      "Registers a new user with a username and password, then returns the created user's public information.",
    request: {
      description: "Registration credentials.",
      example: {
        username: "john_doe",
        password: "StrongPassword123!",
      },
    },
    response: {
      description: "Returns the newly created user's public information.",
      example: {
        user: {
          id: "user_123",
          username: "john_doe",
        },
      },
    },
  },
  {
    endpoint: "/api/auth/login",
    method: "POST",
    description:
      "Authenticates an existing user with their username and password and establishes an authentication session.",
    request: {
      description: "User login credentials.",
      example: {
        username: "john_doe",
        password: "StrongPassword123!",
      },
    },
    response: {
      description: "Returns the authenticated user's public information.",
      example: {
        user: {
          id: "user_123",
          username: "john_doe",
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
          username: "john_doe",
        },
      },
    },
  },
];
