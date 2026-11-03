import type { DatabaseAdapterExample } from "@/types/auth";

export const emailPasswordAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "PostgreSQL · Neon",
    description:
      "Implemented PostgreSQL adapter using Neon serverless queries.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup:
      "Create a users table with id, email, and password_hash columns. The email column must have a UNIQUE constraint.",
    implemented: true,
    code: `import { neon } from "@neondatabase/serverless";

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
  email: string;
  password_hash: string;
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
  };
}

export const authDb: AuthDatabase = {
  async findUserByEmail(email) {
    const sql = getSql();

    const rows = await sql\`
      SELECT id, email, password_hash
      FROM users
      WHERE email = \${email}
      LIMIT 1
    \`;

    const user = rows[0] as
      | { id: string; email: string; password_hash: string }
      | undefined;

    return user ? mapUser(user) : null;
  },

  async findUserById(id) {
    const sql = getSql();

    const rows = await sql\`
      SELECT id, email, password_hash
      FROM users
      WHERE id = \${id}
      LIMIT 1
    \`;

    const user = rows[0] as
      | { id: string; email: string; password_hash: string }
      | undefined;

    return user ? mapUser(user) : null;
  },

  async createUser(input) {
    const sql = getSql();

    const rows = await sql\`
      INSERT INTO users (id, email, password_hash)
      VALUES (\${input.id}, \${input.email}, \${input.passwordHash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, password_hash
    \`;

    const user = rows[0] as
      | { id: string; email: string; password_hash: string }
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
      "Create a users collection and add a unique index on email. Implement the complete AuthDatabase interface before using this adapter.",
    implemented: false,
    code: `import { MongoClient } from "mongodb";

// Reference example only.
// Add connection lifecycle management and implement findUserById
// before using this as a replacement for the Neon adapter.

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
  async findUserByEmail(email: string) {
    const user = await collection.findOne({ email });
    return user
      ? {
          id: user.id,
          email: user.email,
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
      "Create a users table with id, email, and password_hash columns. Add a UNIQUE constraint on email and implement the complete AuthDatabase interface.",
    implemented: false,
    code: `import mysql from "mysql2/promise";

// Reference example only.
// Add findUserById and duplicate-email handling before integration.

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = mysql.createPool(databaseUrl);

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
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
}

export const authDb = {
  async findUserByEmail(email: string) {
    const [rows] = await pool.execute(
      "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    const row = (rows as Array<{
      id: string;
      email: string;
      password_hash: string;
    }>)[0];

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
    };
  },

  async createUser(input: CreateUserInput) {
    await pool.execute(
      "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
      [input.id, input.email, input.passwordHash],
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
      "Create a users table with id, email, and password_hash columns. Keep the service-role key server-only. Implement the complete AuthDatabase interface before using this adapter.",
    implemented: false,
    code: `import { createClient } from "@supabase/supabase-js";

// Reference example only.
// Add findUserById and duplicate-email handling before integration.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase environment variables are not configured.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

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
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
}

export const authDb = {
  async findUserByEmail(email: string) {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
    };
  },

  async createUser(input: CreateUserInput) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: input.id,
        email: input.email,
        password_hash: input.passwordHash,
      })
      .select("id, email, password_hash")
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
    };
  },
};
`,
  },
];
