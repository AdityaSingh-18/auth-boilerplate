import type { ApiPayloadContract } from "@/types/auth";

export const smsOtpApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/request-otp",
    method: "POST",
    description:
      "Validates the supplied phone number, applies the request rate limit, generates a six-digit OTP, stores its HMAC hash, and sends the verification code through the configured SMS provider.",
    request: {
      description: "Provide a phone number in E.164 format.",
      example: {
        phone: "+14155552671",
      },
      typeDefinition: `{
  phone: string;
}`,
    },
    response: {
      description:
        "Returns a generic message indicating that a verification code will be sent if the request is valid.",
      example: {
        message:
          "If the request is valid, a verification code will be sent.",
      },
      typeDefinition: `{
  message: string;
}`,
    },
  },
  {
    endpoint: "/api/auth/verify-otp",
    method: "POST",
    description:
      "Validates the submitted phone number and six-digit OTP, applies verification rate limiting, verifies and consumes the OTP challenge, finds or creates the user, and establishes an authenticated session.",
    request: {
      description:
        "Provide the phone number and six-digit verification code.",
      example: {
        phone: "+14155552671",
        otp: "123456",
      },
      typeDefinition: `{
  phone: string;
  otp: string;
}`,
    },
    response: {
      description:
        "Returns the authenticated user's public information after successful verification.",
      example: {
        user: {
          id: "user-id",
          phone: "+14155552671",
        },
      },
      typeDefinition: `{
  user: {
    id: string;
    phone: string;
  };
}`,
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Logs out the current user by clearing the authentication session cookie.",
    response: {
      description:
        "Returns a confirmation message after the session cookie is cleared.",
      example: {
        message: "Logged out successfully.",
      },
      typeDefinition: `{
  message: string;
}`,
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Retrieves the currently authenticated user's public information using the session cookie. Returns HTTP 401 when no valid session exists.",
    response: {
      description:
        "Returns the authenticated user's ID and phone number.",
      example: {
        user: {
          id: "user-id",
          phone: "+14155552671",
        },
      },
      typeDefinition: `{
  user: {
    id: string;
    phone: string;
  };
}`,
    },
  },
];
