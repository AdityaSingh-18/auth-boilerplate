export type DatabaseAdapterId =
  | "neon"
  | "mongodb"
  | "mysql"
  | "supabase";

export interface DatabaseAdapterExample {
  id: DatabaseAdapterId;
  label: string;
  description: string;
  packageName: string;
  envVariables: string[];
  setup: string;
  code: string;
}

export const databaseAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "PostgreSQL · Neon",
    description: "PostgreSQL adapter using Neon serverless queries.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup: "Create a users table with id, email, and password_hash columns.",
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
  createUser(input: CreateUserInput): Promise<AuthUser>;
}

const sql = neon(process.env.DATABASE_URL!);

export const authDb: AuthDatabase = {
  async findUserByEmail(email) {
    const rows = await sql\`
      SELECT id, email, password_hash
      FROM users
      WHERE email = \${email}
      LIMIT 1
    \`;

    const row = rows[0];
    if (!row) return null;

    return {
      id: String(row.id),
      email: String(row.email),
      passwordHash: String(row.password_hash),
    };
  },

  async createUser(input) {
    const rows = await sql\`
      INSERT INTO users (id, email, password_hash)
      VALUES (\${input.id}, \${input.email}, \${input.passwordHash})
      RETURNING id, email, password_hash
    \`;

    const row = rows[0];

    return {
      id: String(row.id),
      email: String(row.email),
      passwordHash: String(row.password_hash),
    };
  },
};`,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description: "MongoDB adapter using the official MongoDB Node.js driver.",
    packageName: "mongodb",
    envVariables: ["MONGODB_URI", "MONGODB_DB"],
    setup: "Create a users collection and add a unique index on email.",
    code: `import { MongoClient } from "mongodb";

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

const client = new MongoClient(process.env.MONGODB_URI!);
const collection = client
  .db(process.env.MONGODB_DB)
  .collection<AuthUser>("users");

export const authDb: AuthDatabase = {
  async findUserByEmail(email) {
    const user = await collection.findOne({ email });
    return user
      ? {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
        }
      : null;
  },

  async createUser(input) {
    await collection.insertOne(input);
    return input;
  },
};`,
  },
  {
    id: "mysql",
    label: "MySQL",
    description: "MySQL adapter using a connection pool from mysql2.",
    packageName: "mysql2",
    envVariables: ["DATABASE_URL"],
    setup: "Create a users table with id, email, and password_hash columns.",
    code: `import mysql from "mysql2/promise";

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

const pool = mysql.createPool(process.env.DATABASE_URL!);

export const authDb: AuthDatabase = {
  async findUserByEmail(email) {
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

  async createUser(input) {
    await pool.execute(
      "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
      [input.id, input.email, input.passwordHash],
    );

    return input;
  },
};`,
  },
  {
    id: "supabase",
    label: "Supabase",
    description: "Supabase adapter using its JavaScript client.",
    packageName: "@supabase/supabase-js",
    envVariables: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    setup:
      "Create a users table with id, email, and password_hash columns. Keep the service-role key server-only.",
    code: `import { createClient } from "@supabase/supabase-js";

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const authDb: AuthDatabase = {
  async findUserByEmail(email) {
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

  async createUser(input) {
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
};`,
  },
];