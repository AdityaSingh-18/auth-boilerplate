import {
  createGuestUser,
  getUserById,
  promoteGuestAccount,
  type AuthUser,
  type VerifiedIdentity,
} from "./auth-db";

import {
  createSession,
  getSessionUserId,
} from "./session";

// Creates a guest user and starts a session.
// If the visitor already has a valid session, the existing user is returned instead of creating another guest account.
export async function startGuestSession(): Promise<AuthUser> {
  const existingUserId = await getSessionUserId();

  if (existingUserId) {
    const existingUser = await getUserById(existingUserId);

    if (existingUser) {
      return existingUser;
    }
  }

  const guest = await createGuestUser();
  await createSession(guest.id);

  return guest;
}

// Returns the currently authenticated user.
export async function getCurrentUser(): Promise<AuthUser | null> {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return getUserById(userId);
}

// Promotes the currently authenticated guest account.
// The supplied identity must already have been verified by a trusted server-side provider or authentication flow.
// The user's existing session remains valid because the user ID does not change.
export async function promoteCurrentGuestAccount(
  identity: VerifiedIdentity
): Promise<AuthUser> {
  const userId = await getSessionUserId();

  if (!userId) {
    throw new Error("Authentication required");
  }

  return promoteGuestAccount(userId, identity);
}
