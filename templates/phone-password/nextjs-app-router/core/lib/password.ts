import {
  pbkdf2,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const HASH_ALGORITHM = "sha256";
const ITERATIONS = 310_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const MAX_ITERATIONS = 2_000_000;
const MIN_ITERATIONS = 100_000;

// Derives a password hash using PBKDF2.
function deriveKey(
  password: string,
  salt: Buffer,
  iterations: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    pbkdf2(
      password,
      salt,
      iterations,
      KEY_LENGTH,
      HASH_ALGORITHM,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

// Hashes a password with a cryptographically random salt.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await deriveKey(password, salt, ITERATIONS);

  return [
    "pbkdf2",
    HASH_ALGORITHM,
    ITERATIONS,
    salt.toString("hex"),
    derivedKey.toString("hex"),
  ].join("$");
}

// Verifies a password against its stored hash.
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");

  if (parts.length !== 5) return false;

  const [algorithm, hashAlgorithm, iterationsString, saltHex, hashHex] =
    parts;

  if (
    algorithm !== "pbkdf2" ||
    hashAlgorithm !== HASH_ALGORITHM ||
    !/^\d+$/.test(iterationsString) ||
    !/^[a-f0-9]{32}$/i.test(saltHex) ||
    !/^[a-f0-9]{64}$/i.test(hashHex)
  ) {
    return false;
  }

  const iterations = Number(iterationsString);

  if (
    !Number.isSafeInteger(iterations) ||
    iterations < MIN_ITERATIONS ||
    iterations > MAX_ITERATIONS
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const originalHash = Buffer.from(hashHex, "hex");

  const derivedKey = await deriveKey(password, salt, iterations);

  return timingSafeEqual(originalHash, derivedKey);
}
