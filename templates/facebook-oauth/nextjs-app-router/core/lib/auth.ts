import { exchangeFacebookCode, getFacebookProfile } from "./facebook-oauth";
import { getOrCreateFacebookUser } from "./auth-db";
import { createSession } from "./session";

export async function signInWithFacebook(
  code: string,
): Promise<void> {
  if (!code.trim()) {
    throw new Error("Facebook authorization code is missing.");
  }

  const accessToken = await exchangeFacebookCode(code);
  const profile = await getFacebookProfile(accessToken);
  const user = await getOrCreateFacebookUser(profile);

  await createSession(user);
}
