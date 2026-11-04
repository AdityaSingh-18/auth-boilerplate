import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AuthUser } from "./auth-db";

const SESSION_COOKIE = "auth_session";
const SESSION_DURATION = 7 * 24 * 60 * 60;

const SESSION_ISSUER = "google-oauth-auth";
const SESSION_AUDIENCE = "google-oauth-app";

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "AUTH_SECRET must be at least 32 bytes long.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(
  user: AuthUser,
): Promise<void> {
  const secret = getAuthSecret();

  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    imageUrl: user.image_url,
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

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getAuthSecret(),
      {
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
        algorithms: ["HS256"],
      },
    );

    if (!payload.sub || typeof payload.email !== "string") {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name:
        typeof payload.name === "string"
          ? payload.name
          : null,
      image_url:
        typeof payload.imageUrl === "string"
          ? payload.imageUrl
          : null,
      email_verified: true,
    };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}
