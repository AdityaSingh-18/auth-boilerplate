import { getUserById } from "./auth-db";
import { createSession, getSession } from "./session";

export async function getCurrentUser() {
  const session = await getSession();
  return session ? getUserById(session.userId) : null;
}

export async function signInWithPasskey(userId: string) {
  await createSession(userId);
}
