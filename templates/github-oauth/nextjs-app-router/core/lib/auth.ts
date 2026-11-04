import { getGitHubProfile } from "./github-oauth";
import { getOrCreateGitHubUser } from "./auth-db";
import { createSession } from "./session";

export async function signInWithGitHub(code: string): Promise<void> {
  const profile = await getGitHubProfile(code);
  const user = await getOrCreateGitHubUser(profile);

  await createSession(user);
}
