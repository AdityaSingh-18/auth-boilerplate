import type { ApiPayloadContract } from "@/types/auth";

export const passkeysApiContracts: ApiPayloadContract[] = [
  {
    endpoint: "/api/auth/passkeys/register/options",
    method: "POST",
    description:
      "Requires an authenticated user. Generates WebAuthn registration options and stores a registration challenge associated with the current user. The challenge expires after five minutes.",
    response: {
      description:
        "WebAuthn PublicKeyCredentialCreationOptionsJSON returned by @simplewebauthn/server.",
      typeDefinition: `{
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: "public-key";
    alg: number;
  }>;
  timeout?: number;
  excludeCredentials?: Array<{
    id: string;
    type: "public-key";
    transports?: string[];
  }>;
}`,
    },
  },
  {
    endpoint: "/api/auth/passkeys/register/verify",
    method: "POST",
    description:
      "Requires an authenticated user. Accepts the browser's registration response, verifies the challenge and authenticator response, consumes the challenge, and stores the verified passkey credential.",
    request: {
      description:
        "RegistrationResponseJSON returned by startRegistration() from @simplewebauthn/browser.",
      typeDefinition: `{
  id: string;
  rawId: string;
  type: "public-key";
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: string[];
  };
  clientExtensionResults: Record<string, unknown>;
  authenticatorAttachment?: string;
}`,
    },
    response: {
      description:
        "Indicates whether passkey registration was verified and stored.",
      example: {
        verified: true,
      },
    },
  },
  {
    endpoint: "/api/auth/passkeys/authenticate/options",
    method: "POST",
    description:
      "Generates WebAuthn authentication options and stores an authentication challenge. The endpoint does not require an existing session because it is used to begin sign-in.",
    response: {
      description:
        "WebAuthn PublicKeyCredentialRequestOptionsJSON returned by @simplewebauthn/server.",
      typeDefinition: `{
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: Array<{
    id: string;
    type: "public-key";
    transports?: string[];
  }>;
  userVerification?: "required" | "preferred" | "discouraged";
}`,
    },
  },
  {
    endpoint: "/api/auth/passkeys/authenticate/verify",
    method: "POST",
    description:
      "Accepts a browser authentication assertion, verifies it against the stored credential public key and challenge, consumes the challenge, updates the authenticator counter, and creates the user's authentication session.",
    request: {
      description:
        "AuthenticationResponseJSON returned by startAuthentication() from @simplewebauthn/browser.",
      typeDefinition: `{
  id: string;
  rawId: string;
  type: "public-key";
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string | null;
  };
  clientExtensionResults: Record<string, unknown>;
  authenticatorAttachment?: string;
}`,
    },
    response: {
      description:
        "Indicates that the assertion was verified and the session was created.",
      example: {
        verified: true,
      },
    },
  },
  {
    endpoint: "/api/auth/me",
    method: "GET",
    description:
      "Returns the currently authenticated user based on the session cookie. Returns null when no valid session exists.",
    response: {
      description: "Current authenticated user or null.",
      example: {
        user: {
          id: "user-uuid",
          email: "user@example.com",
          name: "Example User",
        },
      },
      typeDefinition: `{
  user: {
    id: string;
    email: string | null;
    name: string | null;
  } | null;
}`,
    },
  },
  {
    endpoint: "/api/auth/logout",
    method: "POST",
    description:
      "Deletes the current authentication session cookie.",
    response: {
      description: "Confirms that the logout request completed.",
      example: {
        success: true,
      },
    },
  },
];
