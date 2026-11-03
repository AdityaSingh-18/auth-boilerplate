import { randomUUID } from "node:crypto";
import { authDb } from "./auth-db";
import { hashPassword, verifyPassword } from "./password";
import {
  createSessionToken,
  getSessionUserId,
  setSessionCookie,
} from "./session";

export interface RegisterInput {
  username: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface PublicUser {
  id: string;
  username: string;
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function validateUsername(username: string): void {
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new Error(
      "Username must be 3–30 characters and contain only letters, numbers, and underscores.",
    );
  }
}

function validatePassword(password: string): void {
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must be between 8 and 128 characters.");
  }
}

function toPublicUser(user: {
  id: string;
  username: string;
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
  };
}

export async function registerUser(
  input: RegisterInput,
): Promise<PublicUser> {
  const username = normalizeUsername(input.username);

  validateUsername(username);
  validatePassword(input.password);

  const existingUser = await authDb.findUserByUsername(username);

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const user = await authDb.createUser({
    id: randomUUID(),
    username,
    passwordHash: await hashPassword(input.password),
  });

  const token = await createSessionToken(user.id);
  await setSessionCookie(token);

  return toPublicUser(user);
}

export async function loginUser(input: LoginInput): Promise<PublicUser> {
  const username = normalizeUsername(input.username);

  validateUsername(username);

  if (!input.password || input.password.length > 128) {
    throw new Error("Invalid username or password.");
  }

  const user = await authDb.findUserByUsername(username);

  if (
    !user ||
    !(await verifyPassword(input.password, user.passwordHash))
  ) {
    throw new Error("Invalid username or password.");
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
