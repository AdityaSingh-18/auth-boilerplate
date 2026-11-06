import "server-only";

import { cookies } from "next/headers";

import { findUserById, type SamlUser } from "./auth-db";
import {
  getSessionCookieName,
  verifySessionToken,
} from "./session";

export async function getCurrentUser(): Promise<SamlUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  return findUserById(session.sub);
}
