import type { DatabaseAdapterExample } from "@/types/auth";

export const phonePasswordAdapters: DatabaseAdapterExample[] = [
  {
    id: "neon",
    label: "PostgreSQL · Neon",
    description:
      "Implemented PostgreSQL adapter using Neon serverless queries.",
    packageName: "@neondatabase/serverless",
    envVariables: ["DATABASE_URL"],
    setup:
      "Create a users table with id, phone, and password_hash columns. The phone column must have a UNIQUE constraint. Store phone numbers in E.164 format.",
    implemented: true,
    code: `import { neon } from "@neondatabase/serverless";

export interface AuthUser {
  id: string;
  phone: string;
  passwordHash: string;
}

export interface CreateUserInput {
  id: string;
  phone: string;
  passwordHash: string;
}

export interface AuthDatabase {
  findUserByPhone(phone: string): Promise<AuthUser | null>;
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
  phone: string;
  password_hash: string;
}): AuthUser {
  return {
    id: row.id,
    phone: row.phone,
    passwordHash: row.password_hash,
  };
}

export const authDb: AuthDatabase = {
  async findUserByPhone(phone) {
    const sql = getSql();

    const rows = await sql\`
      SELECT id, phone, password_hash
      FROM users
      WHERE phone = \${phone}
      LIMIT 1
    \`;

    const user = rows[0] as
      | { id: string; phone: string; password_hash: string }
      | undefined;

    return user ? mapUser(user) : null;
  },

  async findUserById(id) {
    const sql = getSql();

    const rows = await sql\`
      SELECT id, phone, password_hash
      FROM users
      WHERE id = \${id}
      LIMIT 1
    \`;

    const user = rows[0] as
      | { id: string; phone: string; password_hash: string }
      | undefined;

    return user ? mapUser(user) : null;
  },

  async createUser(input) {
    const sql = getSql();

    const rows = await sql\`
      INSERT INTO users (id, phone, password_hash)
      VALUES (\${input.id}, \${input.phone}, \${input.passwordHash})
      ON CONFLICT (phone) DO NOTHING
      RETURNING id, phone, password_hash
    \`;

    const user = rows[0] as
      | { id: string; phone: string; password_hash: string }
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
      "Create a users collection and add a unique index on phone. Store phone numbers in E.164 format. Implement the complete AuthDatabase interface before using this adapter.",
    implemented: false,
    code: `import { MongoClient } from "mongodb";

// Reference example only.
// Add connection lifecycle management and implement findUserById
// before using this as a replacement for the Neon adapter.

export interface AuthUser {
  id: string;
  phone: string;
  passwordHash: string;
}

export interface CreateUserInput {
  id: string;
  phone: string;
  passwordHash: string;
}

export interface AuthDatabase {
  findUserByPhone(phone: string): Promise<AuthUser | null>;
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
  async findUserByPhone(phone: string) {
    const user = await collection.findOne({ phone });

    return user
      ? {
          id: user.id,
          phone: user.phone,
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
      "Create a users table with id, phone, and password_hash columns. Add a UNIQUE constraint on phone and implement the complete AuthDatabase interface.",
    implemented: false,
    code: `import mysql from "mysql2/promise";

// Reference example only.
// Add findUserById and duplicate-phone handling before integration.

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = mysql.createPool(databaseUrl);

export interface AuthUser {
  id: string;
  phone: string;
  passwordHash: string;
}

export interface CreateUserInput {
  id: string;
  phone: string;
  passwordHash: string;
}

export interface AuthDatabase {
  findUserByPhone(phone: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
}

export const authDb = {
  async findUserByPhone(phone: string) {
    const [rows] = await pool.execute(
      "SELECT id, phone, password_hash FROM users WHERE phone = ? LIMIT 1",
      [phone],
    );

    const row = (rows as Array<{
      id: string;
      phone: string;
      password_hash: string;
    }>)[0];

    if (!row) return null;

    return {
      id: row.id,
      phone: row.phone,
      passwordHash: row.password_hash,
    };
  },

  async createUser(input: CreateUserInput) {
    await pool.execute(
      "INSERT INTO users (id, phone, password_hash) VALUES (?, ?, ?)",
      [input.id, input.phone, input.passwordHash],
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
      "Create a users table with id, phone, and password_hash columns. Keep the service-role key server-only. Store phone numbers in E.164 format and implement the complete AuthDatabase interface before using this adapter.",
    implemented: false,
    code: `import { createClient } from "@supabase/supabase-js";

// Reference example only.
// Add findUserById and duplicate-phone handling before integration.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase environment variables are not configured.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export interface AuthUser {
  id: string;
  phone: string;
  passwordHash: string;
}

export interface CreateUserInput {
  id: string;
  phone: string;
  passwordHash: string;
}

export interface AuthDatabase {
  findUserByPhone(phone: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
}

export const authDb = {
  async findUserByPhone(phone: string) {
    const { data, error } = await supabase
      .from("users")
      .select("id, phone, password_hash")
      .eq("phone", phone)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      phone: data.phone,
      passwordHash: data.password_hash,
    };
  },

  async createUser(input: CreateUserInput) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: input.id,
        phone: input.phone,
        password_hash: input.passwordHash,
      })
      .select("id, phone, password_hash")
      .single();

    if (error) throw error;

    return {
      id: data.id,
      phone: data.phone,
      passwordHash: data.password_hash,
    };
  },
};
`,
  },
];
