import "server-only";

import {
  SignJWT,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "auth_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

const SESSION_ISSUER = "oidc-sso-auth";
const SESSION_AUDIENCE = "oidc-sso-app";

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 bytes");
  }

  return new TextEncoder().encode(secret);
}

export type AuthSession = {
  userId: string;
};

type SessionPayload = JWTPayload & {
  sub: string;
};

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export async function createSession(userId: string): Promise<void> {
  if (!userId) {
    throw new Error("A user ID is required to create a session");
  }

  const secret = getSessionSecret();
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_DURATION_SECONDS)
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, getCookieOptions());
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify<SessionPayload>(
      token,
      getSessionSecret(),
      {
        algorithms: ["HS256"],
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
      },
    );

    if (typeof payload.sub !== "string" || !payload.sub) {
      return null;
    }

    return {
      userId: payload.sub,
    };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    ...getCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}
