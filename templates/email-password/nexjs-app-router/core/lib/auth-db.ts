export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
}

export interface CreateUserInput {
  id: string;
  email: string;
  passwordHash: string;
}

export interface AuthDatabase {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
}

const users = new Map<string, AuthUser>();

export const authDb: AuthDatabase = {
  async findUserByEmail(email) {
    return users.get(email) ?? null;
  },

  async createUser(input) {
    if (users.has(input.email)) {
      throw new Error("User already exists.");
    }

    const user: AuthUser = { ...input };
    users.set(input.email, user);

    return user;
  },
};
