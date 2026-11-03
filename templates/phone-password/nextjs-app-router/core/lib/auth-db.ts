import { neon } from "@neondatabase/serverless";

// Represents a user stored in the database.
export interface AuthUser {
  id: string;
  phone: string;
  passwordHash: string;
}

// Input required to create a new user.
export interface CreateUserInput {
  id: string;
  phone: string;
  passwordHash: string;
}

// Database operations required by the authentication logic.
export interface AuthDatabase {
  findUserByPhone(phone: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
}

// Creates a Neon SQL client using the configured database URL.
function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl);
}

// Maps a database row to the application user format.
function mapUser(row: {
  id: string;
  phone: string;
  password_hash: string;
}): AuthUser {
  return {
    id: row.id,
    phone: row.phone,
    passwordHash: row.password_hash,
  };
}

// Neon implementation of the authentication database interface.
export const authDb: AuthDatabase = {
  async findUserByPhone(phone) {
    const sql = getSql();

    const rows = await sql`
      SELECT id, phone, password_hash
      FROM users
      WHERE phone = ${phone}
      LIMIT 1
    `;

    const user = rows[0] as
      | { id: string; phone: string; password_hash: string }
      | undefined;

    return user ? mapUser(user) : null;
  },

  async findUserById(id) {
    const sql = getSql();

    const rows = await sql`
      SELECT id, phone, password_hash
      FROM users
      WHERE id = ${id}
      LIMIT 1
    `;

    const user = rows[0] as
      | { id: string; phone: string; password_hash: string }
      | undefined;

    return user ? mapUser(user) : null;
  },

  async createUser(input) {
    const sql = getSql();

    const rows = await sql`
      INSERT INTO users (id, phone, password_hash)
      VALUES (${input.id}, ${input.phone}, ${input.passwordHash})
      ON CONFLICT (phone) DO NOTHING
      RETURNING id, phone, password_hash
    `;

    const user = rows[0] as
      | { id: string; phone: string; password_hash: string }
      | undefined;

    if (!user) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    return mapUser(user);
  },
};
