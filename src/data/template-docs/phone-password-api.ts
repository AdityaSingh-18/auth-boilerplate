import type { ApiPayloadContract } from "@/types/auth";

export const phonePasswordApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/register",
    method: "POST",
    description:
      "Registers a new user with an international phone number and password, then returns the created user's public information.",
    request: {
      description:
        "Registration credentials. The phone number must be provided in E.164 format.",
      example: {
        phone: "+14155552671",
        password: "StrongPassword123!",
      },
    },
    response: {
      description: "Returns the newly created user's public information.",
      example: {
        user: {
          id: "user_123",
          phone: "+14155552671",
        },
      },
    },
  },
  {
    endpoint: "/api/auth/login",
    method: "POST",
    description:
      "Authenticates an existing user with their phone number and password and establishes an authentication session.",
    request: {
      description:
        "Login credentials. The phone number must be provided in E.164 format.",
      example: {
        phone: "+14155552671",
        password: "StrongPassword123!",
      },
    },
    response: {
      description: "Returns the authenticated user's public information.",
      example: {
        user: {
          id: "user_123",
          phone: "+14155552671",
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
          phone: "+14155552671",
        },
      },
    },
  },
];
