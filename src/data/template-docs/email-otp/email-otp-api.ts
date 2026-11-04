import type { ApiPayloadContract } from "@/types/auth";

export const emailOtpApiContracts: ApiPayloadContract[] = [
  {
    method: "POST",
    endpoint: "/api/auth/request-otp",
    description: "Requests a six-digit OTP to be sent to the supplied email address.",
    request: {
      description: "Provide the email address that should receive the OTP.",
      example: {
        email: "user@example.com",
      },
    },
    response: {
      description: "Generic response confirming the OTP request was processed.",
      example: {
        message: "If the request is valid, a verification code will be sent.",
      },
    },
  },
  {
    method: "POST",
    endpoint: "/api/auth/verify-otp",
    description: "Verifies the submitted OTP and establishes an authenticated session.",
    request: {
      description: "Submit the email address and six-digit verification code.",
      example: {
        email: "user@example.com",
        otp: "123456",
      },
    },
    response: {
      description: "Returns the authenticated user's public information.",
      example: {
        user: {
          id: "user_123",
          email: "user@example.com",
        },
      },
    },
  },
  {
    method: "POST",
    endpoint: "/api/auth/logout",
    description: "Logs out the current user by clearing the authentication session cookie.",
    response: {
      description: "Confirms that the session cookie was cleared.",
      example: {
        message: "Logged out successfully.",
      },
    },
  },
  {
    method: "GET",
    endpoint: "/api/auth/me",
    description: "Retrieves the currently authenticated user's public information.",
    response: {
      description: "Returns the authenticated user when a valid session exists.",
      example: {
        user: {
          id: "user_123",
          email: "user@example.com",
        },
      },
    },
  },
];
