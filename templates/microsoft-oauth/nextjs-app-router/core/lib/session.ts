import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AuthUser } from "./auth-db";

const SESSION_COOKIE = "auth_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

const SESSION_ISSUER = "microsoft-oauth-auth";
const SESSION_AUDIENCE = "microsoft-oauth-app";

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error(
      "AUTH_SECRET must contain at least 32 bytes."
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(
  user: AuthUser
): Promise<void> {
  const secret = getSessionSecret();

  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    image_url: user.image_url,
    email_verified: user.email_verified,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function getSession(): Promise<AuthUser | null> {
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
        payload.image_url === null ||
        typeof payload.image_url === "string"
      ) ||
      typeof payload.email_verified !== "boolean"
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      image_url: payload.image_url,
      email_verified: payload.email_verified,
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
