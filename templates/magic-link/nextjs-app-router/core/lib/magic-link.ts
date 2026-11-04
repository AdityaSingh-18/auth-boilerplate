import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

const MAGIC_LINK_EXPIRY_SECONDS = 15 * 60;
const MAGIC_LINK_ISSUER = "magic-link-auth";
const MAGIC_LINK_AUDIENCE = "magic-link-sign-in";

function getMagicLinkSecret(): Uint8Array {
  const secret = process.env.MAGIC_LINK_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("MAGIC_LINK_SECRET must be configured with at least 32 bytes.");
  }

  return new TextEncoder().encode(secret);
}

export const MAGIC_LINK_CONFIG = {
  expirySeconds: MAGIC_LINK_EXPIRY_SECONDS,
  maxRequests: 5,
  rateLimitWindowSeconds: 15 * 60,
} as const;

export async function generateMagicLinkToken(email: string): Promise<string> {
  return new SignJWT({ email, purpose: "magic-link" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(MAGIC_LINK_ISSUER)
    .setAudience(MAGIC_LINK_AUDIENCE)
    .setSubject(email)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${MAGIC_LINK_EXPIRY_SECONDS}s`)
    .sign(getMagicLinkSecret());
}

export function hashMagicLinkToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function verifyMagicLinkToken(token: string): Promise<{ email: string }> {
  const { payload } = await jwtVerify(token, getMagicLinkSecret(), {
    algorithms: ["HS256"],
    issuer: MAGIC_LINK_ISSUER,
    audience: MAGIC_LINK_AUDIENCE,
    clockTolerance: 5,
  });

  if (
    payload.purpose !== "magic-link" ||
    typeof payload.email !== "string" ||
    payload.sub !== payload.email ||
    typeof payload.jti !== "string"
  ) {
    throw new Error("Invalid magic-link token.");
  }

  return { email: payload.email };
}
