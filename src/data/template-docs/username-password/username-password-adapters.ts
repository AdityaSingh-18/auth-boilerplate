import type { DatabaseAdapterExample } from "@/types/auth";

export const usernamePasswordAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "PostgreSQL · Neon",
    description:
      "Implemented PostgreSQL adapter using Neon serverless queries.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup:
      "Create a users table with id, username, and password_hash columns. The username column must have a UNIQUE constraint.",
    implemented: true,
    code: `import { neon } from "@neondatabase/serverless";

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

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl);
}

function mapUser(row: {
  id: string;
  username: string;
  password_hash: string;
}): AuthUser {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
  };
}

export const authDb: AuthDatabase = {
  async findUserByUsername(username) {
    const sql = getSql();

    const rows = await sql\`
      SELECT id, username, password_hash
      FROM users
      WHERE username = \${username}
      LIMIT 1
    \`;

    const user = rows[0] as
      | { id: string; username: string; password_hash: string }
      | undefined;

    return user ? mapUser(user) : null;
  },

  async findUserById(id) {
    const sql = getSql();

    const rows = await sql\`
      SELECT id, username, password_hash
      FROM users
      WHERE id = \${id}
      LIMIT 1
    \`;

    const user = rows[0] as
      | { id: string; username: string; password_hash: string }
      | undefined;

    return user ? mapUser(user) : null;
  },

  async createUser(input) {
    const sql = getSql();

    const rows = await sql\`
      INSERT INTO users (id, username, password_hash)
      VALUES (\${input.id}, \${input.username}, \${input.passwordHash})
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, password_hash
    \`;

    const user = rows[0] as
      | { id: string; username: string; password_hash: string }
      | undefined;

    if (!user) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    return mapUser(user);
  },
};
`,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description:
      "Reference example for a MongoDB adapter using the official MongoDB Node.js driver. Not yet implemented in this template.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DB"],
    setup:
      "Create a users collection and add a unique index on username. Implement the complete AuthDatabase interface before using this adapter.",
    implemented: false,
    code: `import { MongoClient } from "mongodb";

// Reference example only.
// Add connection lifecycle management and implement findUserById
// before using this as a replacement for the Neon adapter.

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

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB;

if (!uri || !databaseName) {
  throw new Error("MongoDB environment variables are not configured.");
}

const client = new MongoClient(uri);
const collection = client
  .db(databaseName)
  .collection<AuthUser>("users");

export const authDb = {
  async findUserByUsername(username: string) {
    const user = await collection.findOne({ username });

    return user
      ? {
          id: user.id,
          username: user.username,
          passwordHash: user.passwordHash,
        }
      : null;
  },

  async createUser(input: CreateUserInput) {
    await collection.insertOne(input);
    return input;
  },
};
`,
  },
  {
    id: "mysql",
    label: "MySQL",
    description:
      "Reference example for a MySQL adapter using mysql2. Not yet implemented in this template.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup:
      "Create a users table with id, username, and password_hash columns. Add a UNIQUE constraint on username and implement the complete AuthDatabase interface.",
    implemented: false,
    code: `import mysql from "mysql2/promise";

// Reference example only.
// Add findUserById and duplicate-username handling before integration.

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = mysql.createPool(databaseUrl);

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

export const authDb = {
  async findUserByUsername(username: string) {
    const [rows] = await pool.execute(
      "SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1",
      [username],
    );

    const row = (rows as Array<{
      id: string;
      username: string;
      password_hash: string;
    }>)[0];

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
    };
  },

  async createUser(input: CreateUserInput) {
    await pool.execute(
      "INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)",
      [input.id, input.username, input.passwordHash],
    );

    return input;
  },
};
`,
  },
  {
    id: "supabase",
    label: "Supabase",
    description:
      "Reference example for a Supabase adapter using its JavaScript client. Not yet implemented in this template.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    setup:
      "Create a users table with id, username, and password_hash columns. Keep the service-role key server-only. Implement the complete AuthDatabase interface before using this adapter.",
    implemented: false,
    code: `import { createClient } from "@supabase/supabase-js";

// Reference example only.
// Add findUserById and duplicate-username handling before integration.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase environment variables are not configured.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

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

export const authDb = {
  async findUserByUsername(username: string) {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      username: data.username,
      passwordHash: data.password_hash,
    };
  },

  async createUser(input: CreateUserInput) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: input.id,
        username: input.username,
        password_hash: input.passwordHash,
      })
      .select("id, username, password_hash")
      .single();

    if (error) throw error;

    return {
      id: data.id,
      username: data.username,
      passwordHash: data.password_hash,
    };
  },
};
`,
  },
];
