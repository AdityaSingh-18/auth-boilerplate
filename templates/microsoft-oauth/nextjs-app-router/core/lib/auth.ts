import { getOrCreateMicrosoftUser } from "./auth-db";
import { getMicrosoftProfile } from "./microsoft-oauth";
import { createSession } from "./session";

export async function signInWithMicrosoft(
  code: string,
  codeVerifier: string,
  nonce: string
): Promise<void> {
  const profile = await getMicrosoftProfile(
    code,
    codeVerifier,
    nonce
  );

  const user = await getOrCreateMicrosoftUser(profile);

  await createSession(user);
}
