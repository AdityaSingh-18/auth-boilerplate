import { getOrCreateDiscordUser } from "./auth-db";
import { getDiscordProfile } from "./discord-oauth";
import { createSession } from "./session";

export async function signInWithDiscord(
  code: string,
): Promise<void> {
  const profile = await getDiscordProfile(code);

  const user = await getOrCreateDiscordUser(profile);

  await createSession(user);
}