import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  findUserById,
  type AuthUser,
} from "./auth-db";

const COOKIE_NAME = "auth_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "AUTH_SECRET must be configured with at least 32 bytes.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(
  user: AuthUser,
): Promise<void> {
  const token = await new SignJWT({
    phone: user.phone,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("sms-otp-auth")
    .setAudience("sms-otp-app")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getAuthSecret());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getAuthSecret(),
      {
        issuer: "sms-otp-auth",
        audience: "sms-otp-app",
      },
    );

    if (typeof payload.sub !== "string") {
      return null;
    }

    const user = await findUserById(payload.sub);

    if (!user || user.phone !== payload.phone) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
