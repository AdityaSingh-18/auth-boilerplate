import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "auth_session";
const TTL = 60 * 60 * 24 * 7;

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 bytes.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer("passkeys-auth")
    .setAudience("passkeys-app")
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(key());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: TTL,
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      issuer: "passkeys-auth", audience: "passkeys-app",
    });
    return typeof payload.sub === "string" ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).set(COOKIE, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 0,
  });
}
