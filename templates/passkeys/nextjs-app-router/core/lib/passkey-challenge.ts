import { sql } from "./auth-db";

const TTL_SECONDS = 300;

export async function saveChallenge(
  challenge: string,
  purpose: "registration" | "authentication",
  userId: string | null,
) {
  await sql`
    INSERT INTO passkey_challenges (challenge, purpose, user_id, expires_at)
    VALUES (${challenge}, ${purpose}, ${userId}, NOW() + (${TTL_SECONDS} * INTERVAL '1 second'))
  `;
}
