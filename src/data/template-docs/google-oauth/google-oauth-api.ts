import type { ApiPayloadContract } from "@/types/auth";

export const googleOAuthApiContracts: ApiPayloadContract[] = [
  {
    method: "GET",
    endpoint: "/api/auth/google",
    description:
      "Starts Google OAuth sign-in. Generates OAuth state and a PKCE code verifier, stores them in short-lived HTTP-only cookies, and redirects the browser to Google's authorization page.",
  },
  {
    method: "GET",
    endpoint: "/api/auth/google/callback",
    description:
      "Handles Google's OAuth callback. Validates the returned state, exchanges the authorization code using the stored PKCE verifier, verifies the Google identity, creates or links the application user, establishes a session, and redirects the user.",
  },
  {
    method: "POST",
    endpoint: "/api/auth/logout",
    description:
      "Logs out the current user by clearing the application authentication session cookie.",
    response: {
      description: "Confirms that the session cookie was cleared.",
      example: {
        message: "Logged out successfully.",
      },
      typeDefinition: `{
  message: string;
}`,
    },
  },
  {
    method: "GET",
    endpoint: "/api/auth/me",
    description:
      "Retrieves the currently authenticated user's public information using the application session.",
    response: {
      description:
        "Returns the authenticated user when a valid session exists.",
      example: {
        user: {
          id: "user_123",
          email: "user@example.com",
          name: "Example User",
          image_url: "https://example.com/profile.jpg",
          email_verified: true,
        },
      },
      typeDefinition: `{
  user: {
    id: string;
    email: string;
    name: string | null;
    image_url: string | null;
    email_verified: boolean;
  };
}`,
    },
  },
];
