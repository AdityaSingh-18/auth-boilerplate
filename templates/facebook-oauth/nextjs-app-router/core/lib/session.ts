import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AuthUser } from "./auth-db";

const SESSION_COOKIE = "auth_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

const SESSION_ISSUER = "facebook-oauth-auth";
const SESSION_AUDIENCE = "facebook-oauth-app";

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "AUTH_SECRET must be configured and contain at least 32 bytes.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(user: AuthUser): Promise<void> {
  const secret = getSessionSecret();

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
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.emailVerified !== "boolean" ||
      !(
        typeof payload.email === "string" ||
        payload.email === null
      ) ||
      !(
        typeof payload.name === "string" ||
        payload.name === null
      ) ||
      !(
        typeof payload.imageUrl === "string" ||
        payload.imageUrl === null
      )
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      image_url: payload.imageUrl,
      email_verified: payload.emailVerified,
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
