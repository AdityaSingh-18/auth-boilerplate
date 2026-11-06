import type { ApiPayloadContract } from "@/types/auth";

export const samlSsoApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/saml/login",
    method: "GET",
    description:
      "Starts Service Provider-initiated SAML authentication. The server creates an authentication request and redirects the browser to the configured Identity Provider. A temporary RelayState cookie is set before redirecting.",
    response: {
      description:
        "An HTTP redirect to the configured Identity Provider's SSO endpoint. The response also sets a short-lived HTTP-only RelayState cookie.",
      typeDefinition: "HTTP 302 Redirect",
    },
  },
  {
    endpoint: "/api/auth/saml/acs",
    method: "POST",
    description:
      "Assertion Consumer Service endpoint. Receives the Identity Provider's form-encoded SAMLResponse and RelayState, validates the login state and SAML response, retrieves or creates the application user, and issues an application session cookie.",
    request: {
      description:
        "The Identity Provider submits an application/x-www-form-urlencoded form containing the SAML response and RelayState.",
      example: {
        SAMLResponse: "<base64-encoded-saml-response>",
        RelayState: "<original-relay-state>",
      },
    },
    response: {
      description:
        "On successful validation, redirects to the application dashboard and sets the HTTP-only application session cookie. On failure, redirects to the login page with a generic error code.",
      typeDefinition: "HTTP 303 Redirect",
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Returns the profile of the currently authenticated application user. The session is read from the auth_session cookie.",
    response: {
      description: "Returns the authenticated user or an authentication error.",
      example: {
        success: true,
        user: {
          id: "user-uuid",
          email: "user@example.com",
          name: "Example User",
          createdAt: "2026-01-01T10:00:00.000Z",
        },
      },
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Clears the local application session cookie and temporary SAML login-state cookie. This endpoint does not initiate Identity Provider Single Logout.",
    response: {
      description:
        "Redirects the browser to the login page after clearing the local cookies.",
      typeDefinition: "HTTP 303 Redirect",
    },
  },
];
