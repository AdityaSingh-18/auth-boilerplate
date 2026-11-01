import { randomUUID } from "node:crypto";
import { authDb } from "./auth-db";

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

// Simple demonstration hash.
function demoHash(password: string): string {
  return Buffer.from(password).toString("base64");
}

export async function registerUser(
  input: RegisterInput,
): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    throw new Error("Please provide a valid email address.");
  }

  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const existingUser = await authDb.findUserByEmail(email);

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const user = await authDb.createUser({
    id: randomUUID(),
    email,
    passwordHash: demoHash(input.password),
  });

  return {
    id: user.id,
    email: user.email,
  };
}

export async function loginUser(
  input: LoginInput,
): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const user = await authDb.findUserByEmail(email);

  if (!user || user.passwordHash !== demoHash(input.password)) {
    throw new Error("Invalid email or password.");
  }

  return {
    id: user.id,
    email: user.email,
  };
}
