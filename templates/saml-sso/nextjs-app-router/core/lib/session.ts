import "server-only";

import {
  SignJWT,
  jwtVerify,
  type JWTPayload,
} from "jose";

import type { SamlUser } from "./auth-db";

const SESSION_COOKIE_NAME = "auth_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

const SESSION_ISSUER = "saml-sso-auth";
const SESSION_AUDIENCE = "saml-sso-app";

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  const encodedSecret = new TextEncoder().encode(secret);

  if (encodedSecret.byteLength < 32) {
    throw new Error("AUTH_SECRET must be at least 32 bytes long.");
  }

  return encodedSecret;
}

export interface SessionPayload extends JWTPayload {
  sub: string;
  email: string | null;
  name: string | null;
}

export async function createSessionToken(
  user: SamlUser,
): Promise<string> {
  const secret = getSessionSecret();

  return new SignJWT({
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const secret = getSessionSecret();

    const { payload } = await jwtVerify(token, secret, {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || !payload.sub) {
      return null;
    }

    return {
      ...payload,
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionDurationSeconds(): number {
  return SESSION_DURATION_SECONDS;
}
