import { getGoogleProfile } from "./google-oauth";
import { getOrCreateGoogleUser } from "./auth-db";
import { createSession } from "./session";

export async function signInWithGoogle(
  code: string,
  codeVerifier: string,
): Promise<void> {
  const profile = await getGoogleProfile(
    code,
    codeVerifier,
  );

  const user = await getOrCreateGoogleUser(profile);

  await createSession(user);
}
