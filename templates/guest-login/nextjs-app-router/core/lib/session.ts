import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "auth_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

const ISSUER = "guest-login-auth";
const AUDIENCE = "guest-login-app";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 bytes");
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string): Promise<void> {
  const secret = getSecret();

  const token = await new SignJWT({
    sub: userId,
    type: "session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (
      typeof payload.sub !== "string" ||
      payload.type !== "session"
    ) {
      return null;
    }

    return payload.sub;
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
