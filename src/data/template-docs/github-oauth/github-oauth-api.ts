import type { ApiPayloadContract } from "@/types/auth";

export const githubOAuthApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/github",
    method: "GET",
    description:
      "Starts the GitHub OAuth authorization flow. Generates a random state value, stores it in an HTTP-only cookie, and redirects the browser to GitHub's authorization page.",
    response: {
      description:
        "Redirects the browser to GitHub. No JSON response is returned during normal operation.",
    },
  },
  {
    endpoint: "/api/auth/github/callback",
    method: "GET",
    description:
      "Handles the redirect from GitHub after authorization. Validates the OAuth state, exchanges the authorization code for an access token, retrieves the GitHub profile and primary verified email, creates or links the local user, and establishes the application session.",
    request: {
      description:
        "GitHub redirects the browser to this endpoint with OAuth query parameters.",
      example: {
        code: "github_authorization_code",
        state: "random_oauth_state",
      },
      typeDefinition: `{
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}`,
    },
    response: {
      description:
        "On successful authentication, redirects the browser to the application home page and sets the session cookie. On failure, redirects to the login page with an error query parameter.",
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Returns the currently authenticated user's profile using the local session cookie.",
    response: {
      description:
        "Returns the authenticated user when the session is valid. Returns HTTP 401 when the user is not authenticated.",
      example: {
        user: {
          id: "user_uuid",
          email: "user@example.com",
          name: "GitHub User",
          image_url: "https://avatars.githubusercontent.com/u/123456",
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
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Logs out the current user by deleting the local authentication session cookie.",
    response: {
      description:
        "Returns a success response after the session cookie is deleted.",
      example: {
        message: "Logged out successfully.",
      },
      typeDefinition: `{
  message: string;
}`,
    },
  },
];
