import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AuthUser } from "./auth-db";

const SESSION_COOKIE = "auth_session";
const SESSION_DURATION = 7 * 24 * 60 * 60;

const SESSION_ISSUER = "x-oauth-auth";
const SESSION_AUDIENCE = "x-oauth-app";

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "AUTH_SECRET must contain at least 32 bytes."
    );
  }

  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  emailVerified: boolean;
}

export async function createSession(user: AuthUser): Promise<void> {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    imageUrl: user.image_url,
    emailVerified: user.email_verified,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSessionSecret());

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getSessionSecret(),
      {
        algorithms: ["HS256"],
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
      }
    );

    if (
      typeof payload.sub !== "string" ||
      !(
        payload.email === null ||
        typeof payload.email === "string"
      ) ||
      !(
        payload.name === null ||
        typeof payload.name === "string"
      ) ||
      !(
        payload.imageUrl === null ||
        typeof payload.imageUrl === "string"
      ) ||
      typeof payload.emailVerified !== "boolean"
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      imageUrl: payload.imageUrl,
      emailVerified: payload.emailVerified,
    };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
