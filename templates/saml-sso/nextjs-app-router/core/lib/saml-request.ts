import "server-only";

import { randomBytes } from "node:crypto";

import { getSamlClient } from "./saml-config";

export interface SamlAuthorizationRequest {
  authorizationUrl: string;
  relayState: string;
}

export async function createSamlAuthorizationRequest(): Promise<SamlAuthorizationRequest> {
  const relayState = randomBytes(32).toString("base64url");
  const saml = getSamlClient();

  // In @node-saml/node-saml 5.2.0, the second argument is AuthOptions.
  const authorizationUrl = await saml.getAuthorizeUrlAsync(
    relayState,
    {},
  );

  return {
    authorizationUrl,
    relayState,
  };
}
