import "server-only";

import type { Profile } from "@node-saml/node-saml";

import { getSamlAttributeNames, getSamlClient } from "./saml-config";

export interface VerifiedSamlIdentity {
  idpIssuer: string;
  nameId: string;
  nameIdFormat: string | null;
  email: string | null;
  name: string | null;
}

function getAttributeValue(
  attributes: Record<string, unknown> | undefined,
  attributeName: string,
): string | null {
  if (!attributes) {
    return null;
  }

  const value = attributes[attributeName];

  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    const firstValue = value.find(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );

    return firstValue?.trim() || null;
  }

  return null;
}

export async function validateSamlResponse(
  samlResponse: string,
): Promise<VerifiedSamlIdentity> {
  if (!samlResponse || samlResponse.length > 1_000_000) {
    throw new Error("Invalid SAML response.");
  }

  const saml = getSamlClient();

  const { profile, loggedOut } =
    await saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
    });

  if (loggedOut || !profile) {
    throw new Error(
      "The SAML response did not contain an authenticated user.",
    );
  }

  const verifiedProfile = profile as Profile;
  const idpIssuer = verifiedProfile.issuer?.trim();
  const nameId = verifiedProfile.nameID?.trim();

  if (!idpIssuer || !nameId) {
    throw new Error(
      "The SAML response is missing required identity claims.",
    );
  }

  const configuredIssuer = process.env.SAML_IDP_ISSUER?.trim();

  if (!configuredIssuer || idpIssuer !== configuredIssuer) {
    throw new Error(
      "The SAML identity provider issuer did not match.",
    );
  }

  const attributes =
    verifiedProfile.attributes as Record<string, unknown> | undefined;

  const attributeNames = getSamlAttributeNames();

  const email = getAttributeValue(
    attributes,
    attributeNames.email,
  );

  const name = getAttributeValue(
    attributes,
    attributeNames.name,
  );

  return {
    idpIssuer,
    nameId,
    nameIdFormat: verifiedProfile.nameIDFormat ?? null,
    email,
    name,
  };
}
