import { randomUUID } from "node:crypto";
import { authDb } from "./auth-db";
import { hashPassword, verifyPassword } from "./password";
import {
  createSessionToken,
  getSessionUserId,
  setSessionCookie,
} from "./session";

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PublicUser {
  id: string;
  email: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): void {
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("Please provide a valid email address.");
  }
}

function validatePassword(password: string): void {
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must be between 8 and 128 characters.");
  }
}

function toPublicUser(user: {
  id: string;
  email: string;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
  };
}

export async function registerUser(
  input: RegisterInput,
): Promise<PublicUser> {
  const email = normalizeEmail(input.email);

  validateEmail(email);
  validatePassword(input.password);

  const existingUser = await authDb.findUserByEmail(email);

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  let user;

  try {
    user = await authDb.createUser({
      id: randomUUID(),
      email,
      passwordHash: await hashPassword(input.password),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "USER_ALREADY_EXISTS"
    ) {
      throw error;
    }

    throw error;
  }

  const token = await createSessionToken(user.id);
  await setSessionCookie(token);

  return toPublicUser(user);
}

export async function loginUser(
  input: LoginInput,
): Promise<PublicUser> {
  const email = normalizeEmail(input.email);

  validateEmail(email);

  if (!input.password || input.password.length > 128) {
    throw new Error("Invalid email or password.");
  }

  const user = await authDb.findUserByEmail(email);

  if (
    !user ||
    !(await verifyPassword(input.password, user.passwordHash))
  ) {
    throw new Error("Invalid email or password.");
  }

  const token = await createSessionToken(user.id);
  await setSessionCookie(token);

  return toPublicUser(user);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const userId = await getSessionUserId();
  if (!userId) {
    return null;
  }

  const user = await authDb.findUserById(userId);

  return user ? toPublicUser(user) : null;
}
