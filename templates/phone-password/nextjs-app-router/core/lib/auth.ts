import { randomUUID } from "node:crypto";
import { authDb } from "./auth-db";
import { normalizePhoneNumber } from "./phone";
import { hashPassword, verifyPassword } from "./password";
import {
  createSession,
  deleteSession,
  getSession,
} from "./session";

// Public user information returned to the application.
export interface PublicUser {
  id: string;
  phone: string;
}

// Validates password input before hashing or verification.
function validatePassword(password: string): void {
  if (password.length < 8 || password.length > 128) {
    throw new Error("INVALID_PASSWORD");
  }
}

// Registers a user with a phone number and password.
export async function registerUser(
  phone: string,
  password: string,
): Promise<PublicUser> {
  const normalizedPhone = normalizePhoneNumber(phone);

  validatePassword(password);

  const existingUser = await authDb.findUserByPhone(normalizedPhone);

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(password);

  const user = await authDb.createUser({
    id: randomUUID(),
    phone: normalizedPhone,
    passwordHash,
  });

  await createSession(user.id);

  return {
    id: user.id,
    phone: user.phone,
  };
}

// Authenticates a user using their phone number and password.
export async function loginUser(
  phone: string,
  password: string,
): Promise<PublicUser> {
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!password || password.length > 128) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = await authDb.findUserByPhone(normalizedPhone);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isPasswordValid = await verifyPassword(
    password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  await createSession(user.id);

  return {
    id: user.id,
    phone: user.phone,
  };
}

// Returns the currently authenticated user.
export async function getCurrentUser(): Promise<PublicUser | null> {
  const userId = await getSession();

  if (!userId) {
    return null;
  }

  const user = await authDb.findUserById(userId);

  if (!user) {
    await deleteSession();
    return null;
  }

  return {
    id: user.id,
    phone: user.phone,
  };
}
