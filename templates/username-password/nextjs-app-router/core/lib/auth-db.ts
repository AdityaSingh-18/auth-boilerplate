import { neon } from "@neondatabase/serverless";

export interface AuthUser {
  id: string;
  username: string;
  passwordHash: string;
}

export interface CreateUserInput {
  id: string;
  username: string;
  passwordHash: string;
}

export interface AuthDatabase {
  findUserByUsername(username: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl);
}

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
  };
}

export const authDb: AuthDatabase = {
  async findUserByUsername(username) {
    const sql = getSql();

    const rows = await sql`
      SELECT id, username, password_hash
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    const user = rows[0] as UserRow | undefined;

    return user ? mapUser(user) : null;
  },

  async findUserById(id) {
    const sql = getSql();

    const rows = await sql`
      SELECT id, username, password_hash
      FROM users
      WHERE id = ${id}
      LIMIT 1
    `;

    const user = rows[0] as UserRow | undefined;

    return user ? mapUser(user) : null;
  },

  async createUser(input) {
    const sql = getSql();

    const rows = await sql`
      INSERT INTO users (id, username, password_hash)
      VALUES (${input.id}, ${input.username}, ${input.passwordHash})
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, password_hash
    `;

    const user = rows[0] as UserRow | undefined;

    if (!user) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    return mapUser(user);
  },
};
