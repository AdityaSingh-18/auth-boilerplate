import "server-only";

import {
  SAML,
  ValidateInResponseTo,
} from "@node-saml/node-saml";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  return value || undefined;
}

function decodePem(value: string): string {
  const normalized = value.replace(/\\n/g, "\n").trim();

  if (normalized.startsWith("BASE64:")) {
    return Buffer.from(
      normalized.slice("BASE64:".length),
      "base64",
    )
      .toString("utf8")
      .trim();
  }

  return normalized;
}

function validateHttpsOrLocalhost(
  value: string,
  variableName: string,
): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid URL.`);
  }

  const isLocalhost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1";

  if (
    url.protocol !== "https:" &&
    !(isLocalhost && url.protocol === "http:")
  ) {
    throw new Error(
      `${variableName} must use HTTPS outside localhost.`,
    );
  }

  return url.toString();
}

const entryPoint = validateHttpsOrLocalhost(
  requiredEnv("SAML_IDP_ENTRY_POINT"),
  "SAML_IDP_ENTRY_POINT",
);

const idpIssuer = requiredEnv("SAML_IDP_ISSUER");
const spEntityId = requiredEnv("SAML_SP_ENTITY_ID");

const callbackUrl = validateHttpsOrLocalhost(
  requiredEnv("SAML_ACS_URL"),
  "SAML_ACS_URL",
);

const idpCert = decodePem(requiredEnv("SAML_IDP_CERT"));

if (!idpCert.includes("-----BEGIN CERTIFICATE-----")) {
  throw new Error(
    "SAML_IDP_CERT must contain a PEM certificate.",
  );
}

const privateKeyValue = optionalEnv("SAML_SP_PRIVATE_KEY");
const publicCertValue = optionalEnv("SAML_SP_PUBLIC_CERT");

if (privateKeyValue && !publicCertValue) {
  throw new Error(
    "SAML_SP_PUBLIC_CERT is required when SAML_SP_PRIVATE_KEY is configured.",
  );
}

if (!privateKeyValue && publicCertValue) {
  throw new Error(
    "SAML_SP_PRIVATE_KEY is required when SAML_SP_PUBLIC_CERT is configured.",
  );
}

const privateKey = privateKeyValue
  ? decodePem(privateKeyValue)
  : undefined;

const publicCert = publicCertValue
  ? decodePem(publicCertValue)
  : undefined;

export const samlConfig = {
  entryPoint,
  issuer: spEntityId,
  callbackUrl,
  idpCert,
  idpIssuer,
  audience: spEntityId,

  validateInResponseTo: ValidateInResponseTo.always,
  requestIdExpirationPeriodMs: 10 * 60 * 1000,

  wantAuthnResponseSigned: true,
  wantAssertionsSigned: true,

  acceptedClockSkewMs: 2 * 60 * 1000,
  maxAssertionAgeMs: 5 * 60 * 1000,
  rejectReplayedAssertions: true,

  signatureAlgorithm: "sha256" as const,
  digestAlgorithm: "sha256",

  ...(privateKey ? { privateKey } : {}),
  ...(publicCert ? { publicCert } : {}),
};

let samlInstance: SAML | undefined;

export function getSamlClient(): SAML {
  if (!samlInstance) {
    samlInstance = new SAML(samlConfig);
  }

  return samlInstance;
}

export function getSamlAttributeNames() {
  return {
    email: optionalEnv("SAML_EMAIL_ATTRIBUTE") || "email",
    name: optionalEnv("SAML_NAME_ATTRIBUTE") || "displayName",
  };
}
