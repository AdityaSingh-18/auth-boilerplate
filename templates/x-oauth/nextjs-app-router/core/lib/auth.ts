import { exchangeXCode, getXProfile } from "./x-oauth";
import { getOrCreateXUser } from "./auth-db";
import { createSession } from "./session";

export async function signInWithX(
  code: string,
  codeVerifier: string
): Promise<void> {
  if (!code || !codeVerifier) {
    throw new Error("Missing OAuth authorization code or verifier.");
  }

  const tokens = await exchangeXCode(code, codeVerifier);
  const profile = await getXProfile(tokens.access_token);
  const user = await getOrCreateXUser(profile);

  await createSession(user);
}
