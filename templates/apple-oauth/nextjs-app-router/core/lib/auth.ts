import { getOrCreateAppleUser } from "./auth-db";
import { getAppleProfile } from "./apple-oauth";
import { createSession } from "./session";

export async function signInWithApple(
  code: string,
  nonce: string,
  name: string | null
): Promise<void> {
  const profile = await getAppleProfile(code, nonce);
  const user = await getOrCreateAppleUser(profile, name);

  await createSession(user);
}
